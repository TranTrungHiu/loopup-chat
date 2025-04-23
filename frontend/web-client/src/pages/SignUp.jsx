import React, { useState } from "react";
import axios from "axios";
import RegistrationForm from "../pages/register/RegistrationForm.js";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState("");

  return <RegistrationForm></RegistrationForm>;
}
