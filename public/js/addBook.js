"use strict";

async function openModal(id) {
  const response = await axios.get(`/api/fetchBookById/${id}`);
  const data = response.data;

  document.getElementById("modal-title").textContent =
    data.volumeInfo.title || "N/A";
  document.getElementById("modal-author").textContent = data.volumeInfo.authors
    ? data.volumeInfo.authors.join(", ")
    : "N/A";
  document.getElementById("modal-genre").textContent = data.volumeInfo
    .categories
    ? data.volumeInfo.categories.join(", ")
    : "N/A";
  document.getElementById("modal-published").textContent =
    data.volumeInfo.publishedDate || "N/A";
  document.getElementById("modal-pages").textContent =
    data.volumeInfo.pageCount || "N/A";
  document.getElementById("modal-publisher").textContent =
    data.volumeInfo.publisher || "N/A";
  document.getElementById("modal-summary").innerHTML =
    data.volumeInfo.description || "No summary available.";
  const googleBooksLink = data.volumeInfo.infoLink || "#";
  document.getElementById("modal-link").href = googleBooksLink;
  document.getElementById("modal").style.display = "block";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

// Close modal if clicked outside of content
window.onclick = function (event) {
  if (event.target == document.getElementById("modal")) {
    closeModal();
  }
};
