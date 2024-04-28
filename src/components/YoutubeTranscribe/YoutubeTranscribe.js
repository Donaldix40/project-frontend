import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { pdfjs } from "react-pdf";
import logo from "../../assets/favicon.webp";
import Modal from "react-modal";
Modal.setAppElement("#root"); // This is important to avoid accessibility issues
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const YoutubeTranscribeGenerator = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [pdfContent, setPdfContent] = useState("");

  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const textareaRef = useRef();

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleSend = async (text) => {
    let content = text || inputValue;
    if (!content) {
      alert("Please type something or select a question from the actions");
      return;
    }

    setUploaded(false);

    const userMessage = {
      role: "user",
      content,
    };

    setMessages([...messages, userMessage]);
    setInputValue(""); // Clear the input field

    setIsTyping(true);

    content += pdfContent ? " " + pdfContent : "";
    const botResponseText = await chatgpt(
      `You have to use following html tags only like <ol>, <li>, <p>, <h2>, <h4> for generating results. The user message is ${content}`,
      messages
    );
    setIsTyping(false);

    const botResponse = { role: "system", content: botResponseText };
    setMessages((prevMessages) => [...prevMessages, botResponse]);
  };

  async function chatgpt(prompt, previousMessages) {
    try {
      const response = await fetch(
        "https://project-backend-production-fd58.up.railway.app/chatgpt",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            previousMessages,
          }),
        }
      );
      const result = await response.json();
      return result.message;
    } catch (e) {
      return e;
    }
  }

  const GenerateTranscribe = () => {
    const [loading, setLoading] = useState(false);
    const [topic, setTopic] = useState("");

    const [errors, setErrors] = useState({
      topic: false,
    });

    async function fetchTranscript(topic) {
      try {
        const response = await fetch(
          "https://project-backend-production-fd58.up.railway.app/youtube",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ url: topic }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result.transcript;
      } catch (error) {
        console.error("Error fetching transcript:", error);
      }
    }

    const handleGenerate = async () => {
      let formIsValid = true;
      const requiredFields = {
        topic,
      };
      const newErrors = { ...errors };

      Object.keys(requiredFields).forEach((field) => {
        if (!requiredFields[field]) {
          formIsValid = false;
          newErrors[field] = true;
        } else {
          newErrors[field] = false;
        }
      });

      setErrors(newErrors);

      if (formIsValid) {
        setLoading(true);

        const transcript = await fetchTranscript(topic);
        if (!transcript) {
          setLoading(false);
          return;
        }

        const userInput = `Summarize the following youtube transcribe ${transcript}`;

        const botResponseText = await chatgpt(userInput, "");

        setLoading(false);

        const botTranscript = { role: "assistant", content: transcript };
        setMessages([...messages, botTranscript]);

        const botResponse = { role: "system", content: botResponseText };
        console.log(botResponse);
        setMessages([...messages, botResponse]);

        try {
        } catch (error) {
          console.error(error);
        }
      }
    };

    return (
      <div className="w-full lg:w-[40%] space-y-4">
        <div className="flex flex-col items-center gap-4">
          <img src={logo} className="w-40 h-40"></img>
          <h1 className="text-center text-2xl font-bold">
            {" "}
            Youtube Transcribe Generator
          </h1>
        </div>

        <div>
          <label
            className="text-gray-600 font-semibold block mb-2"
            htmlFor="topic"
          >
            Youtube URL:{" "}
            {errors.topic && <small className="text-red-500">* Required</small>}
          </label>
          <textarea
            type="text"
            id="topic"
            className={`border border-gray-300 rounded py-2 px-3 w-full text-gray-700 focus:outline-none focus:shadow-outline`}
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              setErrors({ ...errors, topic: false });
            }}
            rows={2}
            placeholder="Enter the youtube video URL"
          ></textarea>
        </div>

        <div className="flex justify-between gap-4 ">
          <button
            className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-opacity-50"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <span>Summarizing... </span>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              </div>
            ) : (
              "Summarize"
            )}
          </button>
        </div>
      </div>
    );
  };

  const generateAndDownloadWord = () => {
    const header =
      "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
      "xmlns:w='urn:schemas-microsoft-com:office:word' " +
      "xmlns='http://www.w3.org/TR/REC-html40'>" +
      "<head><meta charset='utf-8'><title>Export HTML to Word Document with JavaScript</title></head><body>";
    const footer = "</body></html>";

    const combinedMessages = messages
      .map((message) => message.content + "<br/><br/>")
      .join("");
    const sourceHTML = header + combinedMessages + footer;

    const source =
      "data:application/vnd.ms-word;charset=utf-8," +
      encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = "document.doc";
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [uploaded, setUploaded] = useState(false);

  const onFileChange = async (e) => {
    const file = e.target.files[0];

    if (file && file.type === "application/pdf" && file.size <= 5000000) {
      setUploading(true);
      setUploaded(false);
      setFileName(file.name);

      const reader = new FileReader();
      reader.onload = async (e) => {
        const typedArray = new Uint8Array(e.target.result);
        try {
          const pdfDoc = await pdfjs.getDocument(typedArray).promise;
          console.log(`PDF loaded: ${pdfDoc.numPages} pages`);

          let allText = [];

          for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
            const page = await pdfDoc.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item) => item.str)
              .join(" ");
            allText.push(pageText);
          }

          const fullText = allText.join("\n");

          setPdfContent(fullText);
          setUploaded(true);
        } catch (error) {
          console.error("Error reading PDF: ", error);
        } finally {
          setUploading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert("File must be a PDF and less than 5MB.");
    }
    e.target.value = null;
  };

  const removePDF = () => {
    setUploaded(false);
    setFileName("");
    document.getElementById("pdf-upload").value = null;
  };

  async function generateAndDownloadPDF() {
    const htmlContent = messages
      .map((message) => message.content + "<br/><br/>")
      .join("");

    const response = await fetch(
      "https://project-backend-production-fd58.up.railway.app/generate-pdf",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ htmlContent }),
      }
    );
    if (response.ok) {
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "generated-document.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } else {
      console.error("Failed to generate PDF");
    }
  }

  const [showTooltip, setShowTooltip] = useState(false);
  const copyToClipboard = (htmlContent) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    const textToCopy = tempDiv.textContent || tempDiv.innerText || "";

    navigator.clipboard.writeText(textToCopy).then(() => {
      setShowTooltip(true);
      setTimeout(() => {
        setShowTooltip(false);
      }, 2000);
    });
  };

  return (
    <div className="bg-gray-100 w-full">
      <div className="container mx-auto py-2 px-2">
        <div className="mx-auto bg-white shadow rounded-lg px-2 py-4 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-8">
            <GenerateTranscribe />

            <div className="w-full lg:w-[60%] flex flex-col justify-center">
              <div className="flex justify-end gap-4">
                <div
                  className={`flex items-center rounded-md w-auto text-white px-4 text-xs py-2.5 shadow-sm ${
                    messages.length > 0
                      ? "bg-red-400 focus:outline-none cursor-pointer"
                      : "bg-red-200 cursor-not-allowed"
                  }`}
                  onClick={
                    messages.length > 0 ? undefined : (e) => e.preventDefault()
                  }
                >
                  <i class="fas fa-file-pdf mr-2"></i>
                  {messages.length > 0 ? (
                    <div onClick={() => generateAndDownloadPDF()}>
                      {"Download PDF"}
                    </div>
                  ) : (
                    "Download PDF"
                  )}
                </div>
                <div
                  className={` flex items-center rounded-md w-auto text-white px-4 text-xs py-2.5 shadow-sm ${
                    messages.length > 0
                      ? "bg-blue-400  focus:outline-none cursor-pointer"
                      : "bg-blue-200 cursor-not-allowed"
                  }`}
                  onClick={
                    messages.length > 0 ? undefined : (e) => e.preventDefault()
                  }
                >
                  <i class="far fa-file-word mr-2"></i>
                  {messages.length > 0 ? (
                    <div onClick={() => generateAndDownloadWord()}>
                      {"Download Word"}
                    </div>
                  ) : (
                    "Download Word"
                  )}
                </div>
              </div>
              <div className="p-2 border-gray-200 border-solid border m-0 h-[80vh] w-full bg-gray-100 rounded-lg mt-4">
                <div
                  id="msg"
                  className="h-[76%] sm:h-[89%] p-2 custom-scrollbar overflow-y-auto"
                >
                  {messages.map((message, index) => (
                    <React.Fragment key={index}>
                      <div className={`mt-4 mb-4 text-left relative`}>
                        <span
                          className={`inline-block p-4 w-full rounded-md ${
                            message.role === "system"
                              ? "bg-white"
                              : "bg-gray-200 border border-gray-300 text-gray-800"
                          }`}
                        >
                          <div
                            dangerouslySetInnerHTML={{
                              __html: message.content,
                            }}
                          />
                        </span>
                        {message.role === "system" && (
                          <i
                            class="cursor-pointer absolute top-0 right-0 mt-2 mr-2 text-base text-gray-500 fas fa-copy"
                            onClick={() => copyToClipboard(message.content)}
                          ></i>
                        )}
                        {showTooltip && (
                          <div className="absolute top-0 right-0 mt-8 mr-2 text-xs rounded bg-black text-white py-1 px-2">
                            Copied!
                          </div>
                        )}
                      </div>
                    </React.Fragment>
                  ))}

                  {isTyping && (
                    <div className="text-left mb-2">
                      <span className="inline-block p-3 w-full bg-indigo-300 rounded-lg animate-pulse">
                        Typing...
                      </span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="flex flex-col md:flex-row gap-2">
                  <div className="w-full flex items-center mt-2 mb-2 min-h-[40px] bg-white rounded-lg border border-gray-300 shadow-sm relative">
                    <div className="pl-2">
                      <label htmlFor="pdf-upload">
                        <i className="fa-solid fa-paperclip text-xl h-5 w-5 text-gray-400 cursor-pointer hover:text-gray-800"></i>
                      </label>
                      <input
                        id="pdf-upload"
                        type="file"
                        accept=".pdf"
                        style={{ display: "none" }}
                        onChange={onFileChange}
                      />
                    </div>
                    <textarea
                      ref={textareaRef}
                      placeholder="Type Something"
                      className="flex-grow p-2 text-gray-800 outline-none rounded-md"
                      value={inputValue}
                      onChange={handleInputChange}
                      rows={1}
                    />
                    <div
                      className="mr-1 rounded-md py-1 px-2 bg-gray-300"
                      onClick={() => handleSend(inputValue)}
                    >
                      <i className="fa-solid fa-paper-plane text-xl h-5 w-5 text-gray-600 cursor-pointer hover:text-gray-800"></i>
                    </div>
                  </div>
                </div>

                {uploading && (
                  <div className="flex gap-2 py-2 border border-gray-400 rounded-md bg-white shadow-md px-4">
                    <div className="loader"></div>
                    <div>Uploading {fileName}...</div>
                  </div>
                )}
                {uploaded && (
                  <div className="flex gap-2 py-2 border border-gray-400 rounded-md bg-white shadow-md px-4">
                    <div className="flex items-center">
                      <i className="fa-solid fa-file-pdf text-indigo-600"></i>
                      <span className="mx-2">{fileName}</span>
                      <div
                        className="bg-red-500 px-1 rounded-sm"
                        onClick={removePDF}
                      >
                        <i className="fa-solid fa-times white cursor-pointer text-white"></i>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YoutubeTranscribeGenerator;
