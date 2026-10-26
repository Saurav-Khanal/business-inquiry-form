
import { useState } from "react";

function dashboard() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

 async function handleSubmit(e) {
    e.preventDefault();
    console.log({ name, message });
    try{
        const response=await fetch("http://localhost:3000/inquiries",{
            method:"post",
            headers:{
            "Content-Type": "application/json",
            },
            body:JSON.stringify({
                name:name,
                message:message
            })
        })
        const data=await response.json();
        console.log(data);
    }catch(err){
        console.log(err);
    }
  }

  return (
    <div>
      <h1>Business Inquiry</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <br /><br />

        <textarea
          placeholder="Your message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />

        <br /><br />

        <button type="submit">Submit Inquiry</button>
      </form>
    </div>
  );
}

export default dashboard;
