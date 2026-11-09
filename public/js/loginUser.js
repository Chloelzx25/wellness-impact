document.addEventListener("DOMContentLoaded", function () {

  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  const warningCard = document.getElementById("warningCard");
  const warningText = document.getElementById("warningText");

  const callback = (responseStatus, responseData) => {
    console.log("responseStatus:", responseStatus);
    console.log("responseData:", responseData);

    if (responseStatus === 200) {
      if (!responseData || !responseData.token) {
        warningCard.classList.remove("d-none");
        warningText.innerText = "Login failed: token missing.";
        return;
      }

      // Store login info
      localStorage.setItem("token", responseData.token);
      localStorage.setItem("userId", responseData.userId);

      // (Optional but useful)
      localStorage.setItem(
        "user",
        JSON.stringify({
          user_id: responseData.user_id,
          username: responseData.username,
          role: responseData.role,
        })
      );

      // Redirect after login
      window.location.href = "home.html";

    } else {
      warningCard.classList.remove("d-none");
      warningText.innerText =
        responseData?.message || "Login failed.";
    }
  };

  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const username = document.getElementById("username")?.value.trim();
    const password = document.getElementById("password")?.value;

    if (!username || !password) {
      warningCard.classList.remove("d-none");
      warningText.innerText = "Please fill in all fields.";
      return;
    }

    const data = {
      username: username,
      password: password,
    };

    fetchMethod("/users/login", callback, "POST", data);

    loginForm.reset();
  });
});
