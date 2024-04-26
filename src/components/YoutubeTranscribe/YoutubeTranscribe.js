import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { pdfjs } from "react-pdf";

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

    setIsQuestionsVisible(true);
  };

  const [isQuestionsVisible, setIsQuestionsVisible] = useState(true);

  const handleQuestionClick = (question, index) => {
    setIsQuestionsVisible(false);
    handleSend(question);
  };

  // async function questionChatgpt(prompt) {
  //   const DEFAULT_PARAMS = {
  //     model: "gpt-3.5-turbo-1106",
  //     messages: [
  //       {
  //         role: "system",
  //         content: "Act as a unit plan generator.",
  //       },
  //       { role: "user", content: prompt },
  //     ],
  //   };

  //   const params = { ...DEFAULT_PARAMS };
  //   const requestOptions = {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       Authorization: "Bearer " + String(process.env.REACT_APP_OPEN_AI_KEY),
  //     },
  //     body: JSON.stringify(params),
  //   };
  //   const response = await fetch(
  //     "https://api.openai.com/v1/chat/completions",
  //     requestOptions
  //   );
  //   const data = await response.json();
  //   const result = data.choices[0].message.content;
  //   return result;
  // }

  async function chatgpt(prompt, previousMessages) {
    try {
      
      const response = await fetch("https://ataylor1972-pdfservicebackend-production.up.railway.app/chatgpt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          previousMessages
        }),
      });
      const result = await response.json();
      return result.message;
    } catch (e) {
      return e;
    }
  }

  // async function chatgpt(prompt, previousMessages) {
  //   const DEFAULT_PARAMS = {
  //     model: "gpt-3.5-turbo-1106",
  //     messages: [
  //       {
  //         role: "system",
  //         content: `Act as ChatGPT API Assistant.`,
  //       },
  //       ...previousMessages, // Spread previous messages here
  //       { role: "user", content: prompt },
  //     ],
  //   };

  //   const params = { ...DEFAULT_PARAMS };
  //   const requestOptions = {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       Authorization: "Bearer " + String(process.env.REACT_APP_OPEN_AI_KEY),
  //     },
  //     body: JSON.stringify(params),
  //   };
  //   const response = await fetch(
  //     "https://api.openai.com/v1/chat/completions",
  //     requestOptions
  //   );
  //   const data = await response.json();
  //   const result = data.choices[0].message.content;
  //   return result;
  // }

  const GenerateTranscribe = () => {
    const [loading, setLoading] = useState(false);
    const [topic, setTopic] = useState("");

    const [errors, setErrors] = useState({
      topic: false,
    });

    async function fetchTranscript(topic) {
      try {
        const response = await fetch(
          "https://ataylor1972-pdfservicebackend-production.up.railway.app/youtube",
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
        <div>
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

  const Button = ({ children, onClick }) => (
    <button
      className="group flex h-full items-center border border-gray-400 hover:bg-gray-300 rounded-md px-1 py-2 w-full text-sm font-medium"
      onClick={onClick}
    >
      <span className="text-left text-gray-600 text-xs font-semibold ml-2">
        {children}
      </span>
      <span className="ml-auto mr-1">
        <div className="rounded-md py-1 px-2 bg-gray-400 transform opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <i class="fa-solid fa-paper-plane h-4 w-4 text-gray-600 cursor-pointer hover:text-gray-800"></i>
        </div>
      </span>
    </button>
  );

  // const ActionMenu = () => {
  //   const [isMenuOpen, setIsMenuOpen] = useState(false);
  //   const [isTranslateMenuOpen, setIsTranslateMenuOpen] = useState(false);
  //   const [isQuestionMenuOpen, setIsQuestionMenuOpen] = useState(false);
  //   const [isLengthMenuOpen, setIsLengthMenuOpen] = useState(false);
  //   const [isSummarizeMenuOpen, setIsSummarizeMenuOpen] = useState(false);
  //   const [isCustomMenuOpen, setIsCustomMenuOpen] = useState(false);
  //   const [isModalOpen, setIsModalOpen] = useState(false);

  //   const [customPrompts, setCustomPrompts] = useState(() => {
  //     const savedPrompts = localStorage.getItem("customPrompts");
  //     return savedPrompts
  //       ? JSON.parse(savedPrompts)
  //       : [
  //           {
  //             title: "Differentiate",
  //             description:
  //               "For the output above, give me suggestions to differentiate it for …",
  //           },
  //           {
  //             title: "Rewrite",
  //             description: "Rewrite the output above so that …",
  //           },
  //         ];
  //   });

  //   useEffect(() => {
  //     // Save prompts to local storage whenever they change
  //     localStorage.setItem("customPrompts", JSON.stringify(customPrompts));
  //   }, [customPrompts]);

  //   const deletePrompt = (indexToDelete) => {
  //     const updatedPrompts = customPrompts.filter(
  //       (_, index) => index !== indexToDelete
  //     );
  //     setCustomPrompts(updatedPrompts);
  //   };

  //   const menuRef = useRef(); // Reference to the main menu

  //   const toggleModal = () => setIsModalOpen(!isModalOpen);

  //   const saveCustomPrompt = (title, description) => {
  //     const newPrompt = { title, description };
  //     setCustomPrompts([...customPrompts, newPrompt]);
  //     toggleModal();
  //   };

  //   const toggleMenu = () => {
  //     setIsMenuOpen(!isMenuOpen);
  //     if (!isMenuOpen) {
  //       setIsTranslateMenuOpen(false);
  //       setIsQuestionMenuOpen(false);
  //       setIsCustomMenuOpen(false);
  //       setIsLengthMenuOpen(false);
  //       setIsSummarizeMenuOpen(false);
  //     }
  //   };

  //   useEffect(() => {
  //     function handleClickOutside(event) {
  //       if (menuRef.current && !menuRef.current.contains(event.target)) {
  //         setIsMenuOpen(false);
  //         setIsTranslateMenuOpen(false);
  //         setIsQuestionMenuOpen(false);
  //         setIsCustomMenuOpen(false);
  //       }
  //     }

  //     document.addEventListener("mousedown", handleClickOutside);
  //     return () => {
  //       document.removeEventListener("mousedown", handleClickOutside);
  //     };
  //   }, [menuRef]);

  //   const [selectValue, setSelectValue] = useState("English");
  //   const handleSelectChange = (e) => {
  //     setSelectValue(e.target.value);
  //   };

  //   return (
  //     <div className="mt-2 relative inline-block text-left" ref={menuRef}>
  //       <button
  //         onClick={toggleMenu}
  //         className="inline-flex justify-center w-full px-4 py-2.5 text-sm text-white bg-indigo-600 rounded-md shadow-sm focus:outline-none focus:none"
  //         id="menu-button"
  //         aria-expanded="true"
  //         aria-haspopup="true"
  //       >
  //         <div className="flex gap-2 items-center">
  //           <i className="fa-solid fa-circle-plus"></i>
  //           <span>Actions</span>
  //         </div>
  //       </button>

  //       {isMenuOpen && (
  //         <div
  //           className="absolute bottom-16 left-0 mt-2 w-auto sm:w-56 border border-gray-200 rounded-md shadow-lg bg-white focus:outline-none outline-none"
  //           role="menu"
  //           aria-orientation="vertical"
  //           aria-labelledby="menu-button"
  //           tabIndex="-1"
  //         >
  //           <div className="py-1" role="none">
  //             <a
  //               href="#"
  //               className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100 relative"
  //               role="menuitem"
  //               tabIndex="-1"
  //               onClick={(e) => {
  //                 e.preventDefault();
  //                 setIsTranslateMenuOpen(!isTranslateMenuOpen);
  //                 setIsQuestionMenuOpen(false);
  //                 setIsLengthMenuOpen(false);
  //                 setIsSummarizeMenuOpen(false);
  //                 setIsCustomMenuOpen(false);
  //               }}
  //             >
  //               Translate
  //               {isTranslateMenuOpen && (
  //                 <div
  //                   className="absolute left-full bottom-0 mt-0 ml-2 w-40 sm:w-56 border border-gray-200 rounded-md shadow-lg bg-white py-2 px-2"
  //                   role="menu"
  //                   aria-orientation="vertical"
  //                 >
  //                   <div
  //                     className="flex gap-2"
  //                     onClick={(e) => {
  //                       e.preventDefault();
  //                       e.stopPropagation();
  //                     }}
  //                   >
  //                     <select
  //                       value={selectValue}
  //                       onChange={handleSelectChange}
  //                       className="block w-full pl-1 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm "
  //                     >
  //                       <option>English</option>
  //                       <option>French</option>
  //                       <option>German</option>
  //                       <option>Italian</option>
  //                     </select>
  //                     <button
  //                       className="rounded-md px-2 bg-gray-300"
  //                       onClick={() => {
  //                         setIsQuestionsVisible(false); // Hide the question container
  //                         handleSend(
  //                           `Translate the above content into ${selectValue}`
  //                         );
  //                       }}
  //                     >
  //                       <i class="fa-solid fa-paper-plane text-lg h-5 w-5 text-gray-600 cursor-pointer hover:text-gray-800"></i>
  //                     </button>
  //                   </div>
  //                 </div>
  //               )}
  //             </a>

  //             <a
  //               href="#"
  //               className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100 relative"
  //               role="menuitem"
  //               tabIndex="-1"
  //               onClick={(e) => {
  //                 e.preventDefault();
  //                 setIsQuestionMenuOpen(!isQuestionMenuOpen);
  //                 setIsTranslateMenuOpen(false);
  //                 setIsLengthMenuOpen(false);
  //                 setIsSummarizeMenuOpen(false);
  //                 setIsCustomMenuOpen(false);
  //               }}
  //             >
  //               Questions
  //               {isQuestionMenuOpen && (
  //                 <div
  //                   className="absolute left-full bottom-0 mt-0 ml-2 w-40 sm:w-56 border border-gray-200 rounded-md shadow-lg bg-white"
  //                   role="menu"
  //                   aria-orientation="vertical"
  //                 >
  //                   <a
  //                     href="#"
  //                     className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100"
  //                     role="menuitem"
  //                     onClick={() => {
  //                       setIsQuestionsVisible(false); // Hide the question container
  //                       handleSend(
  //                         `Generate 5 questions for the above content. Make sure they are multiple choice questions.`
  //                       );
  //                     }}
  //                   >
  //                     Multiple Choice
  //                   </a>
  //                   <a
  //                     href="#"
  //                     className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100"
  //                     role="menuitem"
  //                     onClick={() => {
  //                       setIsQuestionsVisible(false); // Hide the question container
  //                       handleSend(
  //                         `Generate 5 questions for the above content. Make sure they are free response questions.`
  //                       );
  //                     }}
  //                   >
  //                     Free Response
  //                   </a>
  //                 </div>
  //               )}
  //             </a>

  //             <a
  //               href="#"
  //               className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100 relative"
  //               role="menuitem"
  //               tabIndex="-1"
  //               onClick={(e) => {
  //                 e.preventDefault();
  //                 setIsLengthMenuOpen(!isLengthMenuOpen);
  //                 setIsTranslateMenuOpen(false);
  //                 setIsQuestionMenuOpen(false);
  //                 setIsSummarizeMenuOpen(false);
  //                 setIsCustomMenuOpen(false);
  //               }}
  //             >
  //               Length
  //               {isLengthMenuOpen && (
  //                 <div
  //                   className="absolute left-full bottom-0 mt-0 ml-2 w-40 sm:w-56 border border-gray-200 rounded-md shadow-lg bg-white"
  //                   role="menu"
  //                   aria-orientation="vertical"
  //                 >
  //                   <a
  //                     href="#"
  //                     className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100"
  //                     role="menuitem"
  //                     onClick={() => {
  //                       setIsQuestionsVisible(false); // Hide the question container
  //                       handleSend(
  //                         `Rewrite this to be 50% shorter while maintaining the tone and meaning.`
  //                       );
  //                     }}
  //                   >
  //                     Shorter
  //                   </a>
  //                   <a
  //                     href="#"
  //                     className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100"
  //                     role="menuitem"
  //                     onClick={() => {
  //                       setIsQuestionsVisible(false); // Hide the question container
  //                       handleSend(
  //                         `Rewrite this to be up to twice as long while maintaining the tone and meaning in order to make it easier to understand.`
  //                       );
  //                     }}
  //                   >
  //                     Longer
  //                   </a>
  //                 </div>
  //               )}
  //             </a>

  //             <a
  //               href="#"
  //               className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100 relative"
  //               role="menuitem"
  //               tabIndex="-1"
  //               onClick={(e) => {
  //                 e.preventDefault();
  //                 setIsSummarizeMenuOpen(!isSummarizeMenuOpen);
  //                 setIsTranslateMenuOpen(false);
  //                 setIsQuestionMenuOpen(false);
  //                 setIsLengthMenuOpen(false);
  //                 setIsCustomMenuOpen(false);
  //               }}
  //             >
  //               Summarize
  //               {isSummarizeMenuOpen && (
  //                 <div
  //                   className="absolute left-full bottom-0 mt-0 ml-2 w-40 sm:w-56 border border-gray-200 rounded-md shadow-lg bg-white"
  //                   role="menu"
  //                   aria-orientation="vertical"
  //                 >
  //                   <a
  //                     href="#"
  //                     className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100"
  //                     role="menuitem"
  //                     onClick={() => {
  //                       setIsQuestionsVisible(false); // Hide the question container
  //                       handleSend(`Summarize this in exactly one sentence.`);
  //                     }}
  //                   >
  //                     Sentence
  //                   </a>
  //                   <a
  //                     href="#"
  //                     className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100"
  //                     role="menuitem"
  //                     onClick={() => {
  //                       setIsQuestionsVisible(false); // Hide the question container
  //                       handleSend(`Summarize this in exactly one paragraph.`);
  //                     }}
  //                   >
  //                     Paragraph
  //                   </a>
  //                   <a
  //                     href="#"
  //                     className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100"
  //                     role="menuitem"
  //                     onClick={() => {
  //                       setIsQuestionsVisible(false); // Hide the question container
  //                       handleSend(`Summarize this in bullet point format.`);
  //                     }}
  //                   >
  //                     Bullet Points
  //                   </a>
  //                 </div>
  //               )}
  //             </a>

  //             <a
  //               href="#"
  //               className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100 relative"
  //               role="menuitem"
  //               tabIndex="-1"
  //               onClick={(e) => {
  //                 e.preventDefault();
  //                 setIsCustomMenuOpen(!isCustomMenuOpen);
  //                 setIsTranslateMenuOpen(false);
  //                 setIsQuestionMenuOpen(false);
  //                 setIsLengthMenuOpen(false);
  //                 setIsSummarizeMenuOpen(false);
  //               }}
  //             >
  //               Custom
  //               {isCustomMenuOpen && (
  //                 <div
  //                   className="absolute left-full bottom-0 mt-0 ml-2 w-40 sm:w-56 border border-gray-200 rounded-md shadow-lg bg-white"
  //                   role="menu"
  //                   aria-orientation="vertical"
  //                   aria-labelledby="menu-button"
  //                   onClick={(e) => {
  //                     e.preventDefault();
  //                     setIsMenuOpen(!isMenuOpen);
  //                   }}
  //                 >
  //                   <div className="py-1" role="none">
  //                     <span className="text-xs  text-indigo-600 px-2">
  //                       Custom Prompts
  //                     </span>
  //                     {customPrompts.map((prompt, index) => (
  //                       <div
  //                         key={index}
  //                         className="flex justify-between items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
  //                         onClick={() => setInputValue(prompt.description)}
  //                       >
  //                         {prompt.title}
  //                         <button
  //                           onClick={(e) => {
  //                             e.stopPropagation();
  //                             deletePrompt(index);
  //                           }}
  //                           className="text-gray-500 hover:text-gray-800"
  //                         >
  //                           <i className="fas fa-trash" aria-hidden="true"></i>
  //                         </button>
  //                       </div>
  //                     ))}
  //                     <div className="py-1">
  //                       <button
  //                         className="group w-full flex items-center justify-center px-4 py-2 text-sm text-indigo-600 hover:bg-gray-100"
  //                         role="menuitem"
  //                         onClick={(e) => {
  //                           e.preventDefault();
  //                           toggleModal();
  //                         }}
  //                       >
  //                         <span>+ Add Custom Prompt</span>
  //                       </button>
  //                     </div>
  //                   </div>
  //                 </div>
  //               )}
  //             </a>
  //           </div>
  //         </div>
  //       )}

  //       <Modal
  //         isOpen={isModalOpen}
  //         onRequestClose={toggleModal}
  //         contentLabel="Add Custom Prompt"
  //         className="m-4 border border-gray-300 shadow-lg w-full max-w-md p-5 absolute top-1/4 left-1/2 transform -translate-x-1/2 bg-white rounded-md"
  //       >
  //         <h2 className="text-lg font-semibold mb-4">Add Custom Prompt</h2>
  //         <form
  //           onSubmit={(e) => {
  //             e.preventDefault();
  //             saveCustomPrompt(
  //               e.target.title.value,
  //               e.target.description.value
  //             );
  //           }}
  //         >
  //           <div className="mb-4">
  //             <label
  //               htmlFor="title"
  //               className="block text-sm font-medium text-gray-700"
  //             >
  //               Prompt Title
  //             </label>
  //             <input
  //               type="text"
  //               name="title"
  //               id="title"
  //               required
  //               className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 outline-none focus:outline-none"
  //             />
  //           </div>
  //           <div className="mb-6">
  //             <label
  //               htmlFor="description"
  //               className="block text-sm font-medium text-gray-700"
  //             >
  //               Prompt Description
  //             </label>
  //             <textarea
  //               name="description"
  //               id="description"
  //               rows="3"
  //               required
  //               className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 outline-none focus:outline-none"
  //             />
  //           </div>
  //           <div className="flex justify-end">
  //             <button
  //               type="button"
  //               className="inline-flex mr-3 justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
  //               onClick={toggleModal}
  //             >
  //               Cancel
  //             </button>
  //             <button
  //               type="submit"
  //               className="inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
  //             >
  //               Save
  //             </button>
  //           </div>
  //         </form>
  //       </Modal>
  //     </div>
  //   );
  // };

  // const [questions, setQuestions] = useState({});
  // const fetchQuestionsForMessage = async (content, index) => {
  //   const prompt = `Based on the following content, generate two short questions (5 to 10 words each) without numbering them:\n\n"${content}"`;

  //   const response = await questionChatgpt(prompt);

  //   const questions = response
  //     .split("\n")
  //     .filter((line) => line.trim() !== "")
  //     .slice(0, 2);

  //   // Update the state with the new questions
  //   setQuestions(() => ({
  //     [index]: questions,
  //   }));
  // };

  // useEffect(() => {
  //   messages.forEach((message, index) => {
  //     if (message.role === "system") {
  //       fetchQuestionsForMessage(message.content, index);
  //     }
  //   });
  // }, [messages]);

  const generateAndDownloadWord = () => {
    const header =
      "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
      "xmlns:w='urn:schemas-microsoft-com:office:word' " +
      "xmlns='http://www.w3.org/TR/REC-html40'>" +
      "<head><meta charset='utf-8'><title>Export HTML to Word Document with JavaScript</title></head><body>";
    const footer = "</body></html>";

    // Combine all message contents into one HTML string with line breaks between them
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
    fileDownload.download = "document.doc"; // Or "document.docx" for more recent versions of Word
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState(""); // State to store the uploaded file name
  const [uploaded, setUploaded] = useState(false);

  const onFileChange = async (e) => {
    const file = e.target.files[0];

    if (file && file.type === "application/pdf" && file.size <= 5000000) {
      setUploading(true);
      setUploaded(false);
      setFileName(file.name); // Set the file name for displaying

      // Initialize FileReader
      const reader = new FileReader();
      reader.onload = async (e) => {
        const typedArray = new Uint8Array(e.target.result);
        try {
          // Assuming pdfjs is correctly imported and used
          const pdfDoc = await pdfjs.getDocument(typedArray).promise;
          console.log(`PDF loaded: ${pdfDoc.numPages} pages`);

          // Initialize an array to hold the text of each page
          let allText = [];

          // Loop through each page of the PDF
          for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
            const page = await pdfDoc.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item) => item.str)
              .join(" ");
            allText.push(pageText);
          }

          // Combine the text from all pages into a single string
          const fullText = allText.join("\n"); // You can change '\n' to ' ' or any separator you prefer

          // Update the state with the full text
          setPdfContent(fullText);
          setUploaded(true);
        } catch (error) {
          console.error("Error reading PDF: ", error);
        } finally {
          setUploading(false); // Ensure we always turn off the uploading indicator
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert("File must be a PDF and less than 5MB.");
    }
    e.target.value = null;
  };

  const removePDF = () => {
    setUploaded(false); // Remove the uploaded state
    setFileName(""); // Clear the file name
    // Additional logic to handle the removal from messageArray or backend if needed
    document.getElementById("pdf-upload").value = null;
  };

  async function generateAndDownloadPDF() {
    const htmlContent = messages
      .map((message) => message.content + "<br/><br/>")
      .join("");

    const response = await fetch(
      "https://ataylor1972-pdfservicebackend.onrender.com/generate-pdf",
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

                      {/* {isQuestionsVisible &&
                        message.role === "system" &&
                        questions[index] && (
                          <div className="flex flex-wrap mb-2">
                            {questions[index].map((question, qIndex) => (
                              <div key={qIndex} className="w-full sm:w-1/2 p-1">
                                <Button
                                  onClick={() => handleQuestionClick(question)}
                                >
                                  {question}
                                </Button>
                              </div>
                            ))}
                          </div>
                        )} */}
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
                  {/* <ActionMenu /> */}
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
