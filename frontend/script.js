// ========================================
// MECC WEBSITE JAVASCRIPT
// ========================================

document.addEventListener("DOMContentLoaded", function () {

    // ========================================
    // STUDENT REGISTRATION
    // ========================================

    const registerForm =
        document.getElementById("registerForm");

    if (registerForm) {

        registerForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                // Get registration values

                const fullName =
                    document.getElementById("fullName")
                        .value.trim();

                const email =
                    document.getElementById("email")
                        .value.trim();

                const phone =
                    document.getElementById("phone")
                        .value.trim();

                const course =
                    document.getElementById("course")
                        .value;

                const password =
                    document.getElementById("password")
                        .value;

                const confirmPassword =
                    document.getElementById("confirmPassword")
                        .value;


                // Check password

                if (password !== confirmPassword) {

                    alert(
                        "Passwords do not match."
                    );

                    return;
                }


                try {

                    // Send registration data

                    const response = await fetch(
                        "http://localhost:3000/register",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                fullName: fullName,

                                email: email,

                                phone: phone,

                                course: course,

                                password: password

                            })
                        }
                    );


                    const data =
                        await response.json();


                    // Registration successful

                    if (data.success) {

                        alert(
                            "Student registered successfully!"
                        );


                        registerForm.reset();


                        window.location.href =
                            "login.html";

                    }

                    else {

                        alert(
                            data.message
                        );

                    }

                }

                catch (error) {

                    console.error(
                        "Registration Error:",
                        error
                    );


                    alert(
                        "Unable to connect to MECC server."
                    );

                }

            }
        );

    }


    // ========================================
    // STUDENT LOGIN
    // ========================================

    const loginForm =
        document.getElementById("loginForm");


    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                // Get login values

                const email =
                    document.getElementById("email")
                        .value.trim();

                const password =
                    document.getElementById("password")
                        .value;


                // Check fields

                if (!email || !password) {

                    alert(
                        "Please enter email and password."
                    );

                    return;
                }


                try {

                    // Send login request

                    const response = await fetch(
                        "http://localhost:3000/login",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                email: email,

                                password: password

                            })
                        }
                    );


                    const data =
                        await response.json();


                    // Login successful

                    if (data.success) {

                        alert(
                            "Login successful!"
                        );


                        // Save student data

                        localStorage.setItem(
                            "meccStudent",
                            JSON.stringify(
                                data.student
                            )
                        );


                        // Open dashboard

                        window.location.href =
                            "dashboard.html";

                    }

                    else {

                        alert(
                            data.message
                        );

                    }

                }

                catch (error) {

                    console.error(
                        "Login Error:",
                        error
                    );


                    alert(
                        "Unable to connect to MECC server."
                    );

                }

            }
        );

    }

});