import logo from './logo.svg';
import './styles/globals.css';
import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import CircularProgress from '@mui/material/CircularProgress';
import styles from './styles/Home.module.css'
import user from './assets/usericon.png'
import parrot from './assets/parroticon.png'

const App = () => {
  const [userInput, setUserInput] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState('');
  const [messages, setMessages] = useState([
    {
      "message": "Hi there! How can I help?",
      "type": "apiMessage"
    }
  ]);
  const messageListRef = useRef(null);
  const textAreaRef = useRef(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    const messageList = messageListRef.current;
    messageList.scrollTop = messageList.scrollHeight;
  }, [messages]);

  // Focus on text field on load
  useEffect(() => {
    textAreaRef.current.focus();
  }, []);

  // Handle errors
  const handleError = () => {
    setMessages((prevMessages) => [...prevMessages, { "message": "Oops! There seems to be an error. Please try again.", "type": "apiMessage" }]);
    setLoading(false);
    setUserInput("");
  }


   // Handle form submission
   const handleSubmit = async(e) => {
    e.preventDefault();

    if (userInput.trim() === "") {
      return;
    }

    setLoading(true);
    setMessages((prevMessages) => [...prevMessages, { "message": userInput, "type": "userMessage" }]);

    // Send user question and history to API
    const socket = new WebSocket('ws://localhost:9000/chat');

    socket.addEventListener('open', (event) => {
      console.log('WebSocket connected');

      const message = JSON.stringify({ question: userInput, history: history });
      socket.send(message);
    });

    // Start sreaming the messagws
    let concatenatedMessage = "";
    socket.addEventListener('message', (event) => {
      console.log(`Received message: ${event.data}`);
      const data = JSON.parse(event.data);

      if (data.type === 'start') {
        // Create a new "apiMessage" with an empty message when the response starts
        setMessages((prevMessages) => [...prevMessages, { "message": '', "type": "apiMessage" }]);
      } else if (data.type === 'stream' && data.sender === 'bot') {
        concatenatedMessage += data.message;
        // Update the displayed message when a punctuation mark, newline character, or whitespace is received.
        if (data.message.match(/[.,!?;\n\s]/)) {
          setMessages((prevMessages) => {
            const newMessages = [...prevMessages];
            if (newMessages[newMessages.length - 1].type === 'apiMessage') {
              newMessages[newMessages.length - 1].message = concatenatedMessage;
            }
            return newMessages;
          });
        }
      } else if (data.type === 'end') {
        // Reset concatenatedMessage when the stream ends
        concatenatedMessage = "";
        setLoading(false);
      } else if (data.type === 'error') {
        handleError();
      }
    });



    // Reset user input
    setUserInput("");
};

  // Prevent blank submissions and allow for multiline input
  const handleEnter = (e) => {
    if (e.key === "Enter" && userInput) {
      if(!e.shiftKey && userInput) {
        handleSubmit(e);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  // Keep history in sync with messages
  useEffect(() => {
    if (messages.length >= 3) {
      setHistory([[messages[messages.length - 2].message, messages[messages.length - 1].message]]);
    }
    }, [messages])

  return (
    <div className="App">
      <div className={styles.topnav}>
        <div className = {styles.navlogo}>
            <a href="/">LangChain</a>
          </div>
        <div className = {styles.navlinks}>
          <a href="https://langchain.readthedocs.io/en/latest/" target="_blank">Docs</a>
            <a href="https://github.com/zahidkhawaja/langchain-chat-nextjs" target="_blank">GitHub</a>
        </div>
      </div>
   <main className={styles.main}>
      <div className = {styles.cloud}>
        <div ref={messageListRef} className = {styles.messagelist}>
        {messages.map((message, index) => {
          return (
            // The latest message sent by the user will be animated while waiting for a response
              <div key = {index} className = {message.type === "userMessage" && loading && index === messages.length - 1  ? styles.usermessagewaiting : message.type === "apiMessage" ? styles.apimessage : styles.usermessage}>
                {/* Display the correct icon depending on the message type */}
                {message.type === "apiMessage" ? <img src = {parrot} alt = "AI" width = "30" height = "30" className = {styles.boticon} priority = {true} /> : <img src = {user} alt = "Me" width = "30" height = "30" className = {styles.usericon} priority = {true} />}
              <div className = {styles.markdownanswer}>
                {/* Messages are being rendered in Markdown format */}
                <ReactMarkdown linkTarget = {"_blank"}>{message.message}</ReactMarkdown>
                </div>
              </div>
          )
        })}
        </div>
            </div>
           <div className={styles.center}>

            <div className = {styles.cloudform}>
           <form onSubmit = {handleSubmit}>
          <textarea
          disabled = {loading}
          onKeyDown={handleEnter}
          ref = {textAreaRef}
          autoFocus = {false}
          rows = {1}
          maxLength = {512}
          type="text"
          id="userInput"
          name="userInput"
          placeholder = {loading? "Waiting for response..." : "Type your question..."}
          value = {userInput}
          onChange = {e => setUserInput(e.target.value)}
          className = {styles.textarea}
          />
            <button
            type = "submit"
            disabled = {loading}
            className = {styles.generatebutton}
            >
            {loading ? <div className = {styles.loadingwheel}><CircularProgress color="inherit" size = {20}/> </div> :
            // Send icon SVG in input field
            <svg viewBox='0 0 20 20' className={styles.svgicon} xmlns='http://www.w3.org/2000/svg'>
            <path d='M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z'></path>
          </svg>}
            </button>
            </form>
            </div>
            <div className = {styles.footer}>
            <p>Powered by <a href = "https://github.com/hwchase17/langchain" target="_blank">LangChain</a>. Built by <a href="https://www.sentnl.io" target="_blank">Sentnl</a>.</p>
            </div>
        </div>
      </main>
    </div>
  );
}

export default App;
