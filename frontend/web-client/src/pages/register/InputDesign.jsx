"use client";
import React from "react";
import styles from "./InputDesign.module.css";
import RegistrationForm from "./RegistrationForm";

function InputDesign() {
  return (
    <main className={styles.container}>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@300;400;700&family=Roboto:wght@400;700&family=Rowdies:wght@400&display=swap"
      />
      <section className={styles.formCard}>
        <div>
          <img
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/0fb0eb6b402b71711e4e4970a2cc63e46a437eca"
            alt="Logo"
            className={styles.logoImage}
          />
        </div>
        <RegistrationForm />
      </section>
    </main>
  );
}

export default InputDesign;
