// Waitlist form. Set WAITLIST_ENDPOINT to any provider URL that accepts a POST
// with a form field named "email". While it is empty, the button opens a
// pre-filled mail to abhi@werkbot.xyz instead.
const WAITLIST_ENDPOINT = "";
const WAITLIST_MAILTO = "mailto:abhi@werkbot.xyz?subject=Werkbot%20waitlist";

document.querySelectorAll("form.waitlist").forEach((form) => {
  const msg = form.parentElement.querySelector(".wl-msg");
  const button = form.querySelector("button");
  const input = form.querySelector("input[name=email]");
  const say = (text, kind) => {
    msg.textContent = text;
    msg.className = "wl-msg" + (kind ? " " + kind : "");
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = input.value.trim();
    if (!input.checkValidity() || !email) {
      say("Enter a valid email address.", "err");
      input.focus();
      return;
    }
    if (!WAITLIST_ENDPOINT) {
      window.location.href = WAITLIST_MAILTO + "&body=" + encodeURIComponent("Please add " + email + " to the Werkbot waitlist.");
      say("Your mail app should open. If it does not, write to abhi@werkbot.xyz.", "");
      return;
    }
    button.disabled = true;
    say("Sending", "");
    try {
      const response = await fetch(WAITLIST_ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new URLSearchParams(new FormData(form)),
      });
      if (!response.ok) throw new Error("status " + response.status);
      form.reset();
      say("You are on the list. We write once, when Werkbot opens.", "ok");
    } catch (error) {
      say("That did not go through. Try again, or write to abhi@werkbot.xyz.", "err");
    } finally {
      button.disabled = false;
    }
  });
});
