// header-loader.js
function loadHeader() {
  fetch("header.html")
    .then(response => response.text())
    .then(data => {
      document.getElementById("header-container").innerHTML = data;

      // Firebase স্ক্রিপ্টগুলো পুনরায় চালু করার জন্য eval
      const scripts = document.getElementById("header-container").getElementsByTagName("script");
      for (let i = 0; i < scripts.length; i++) {
        const script = document.createElement("script");
        if (scripts[i].src) {
          script.src = scripts[i].src;
        } else {
          script.text = scripts[i].text;
        }
        document.body.appendChild(script);
      }
    })
    .catch(error => console.error("Header load failed:", error));
}