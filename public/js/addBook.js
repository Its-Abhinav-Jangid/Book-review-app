// "use strict";
document.getElementById("summary").addEventListener("focus", function () {
  this.style.visibility = "hidden";
  this.offsetHeight; // Trigger reflow
  this.style.visibility = "visible";
});
function clearForm() {
  document.querySelector("#addBookModal #bookTitle").value = "";
  document.querySelector("#addBookModal #author").value = "";
  document.querySelector("#addBookModal #genre").value = "";
  document.querySelector("#addBookModal #publishedYear").value = "";
  document.querySelector("#addBookModal #publisher").value = "";
  document.querySelector("#addBookModal #summary").value = "";
}

async function fillData(data, textContent) {
  console.log(data)
  // For viewing data (textContent = true)
  let stars = ""
  if (textContent) {
    
    for (let i=1; i <=5; i++) { 
      
      if (i <=data.volumeInfo.averageRating) { 
        stars +=  `<i class="fa-solid fa-star"></i>`
      } else { 
          stars += `<i class="fa-regular fa-star"></i>`
           } 
            
        } 

    document.getElementById("bookTitle").textContent =
      data.volumeInfo.title || "N/A";
    document.getElementById("author").textContent = data.volumeInfo.authors
      ? data.volumeInfo.authors.join(", ")
      : "N/A";
    document.getElementById("genre").textContent = data.volumeInfo.categories
      ? data.volumeInfo.categories.join(", ")
      : "N/A";
    document.getElementById("publishedYear").textContent =
      data.volumeInfo.publishedDate || "N/A";
    document.getElementById("pages").textContent =
      data.volumeInfo.pageCount || "N/A";
    document.getElementById("publisher").textContent =
      data.volumeInfo.publisher || "N/A";
    document.getElementById("summary").innerHTML =
      data.volumeInfo.description || "No summary available.";
    document.getElementById("modal-rating").innerHTML = stars
  }
  // For adding/editing data (textContent = false)
  else {
    try {
      // Send a GET request to the backend
      const htmlInput = data.volumeInfo.description;
      const response = await fetch(
        `http://localhost:3000/htmlToText?html=${htmlInput}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const responseData = await response.json(); // Renamed from `data` to `responseData`
      data.volumeInfo.description = responseData.text;
    } catch (error) {
      console.error("Error:", error);
    }
    document.querySelector("#addBookModal #cover_image_url").value = data
      .volumeInfo.imageLinks
      ? data.volumeInfo.imageLinks.thumbnail
      : "/images/default-cover.jpg";
    document.querySelector("#addBookModal #bookTitle").value =
      data.volumeInfo.title || "";
    document.querySelector("#addBookModal #author").value = data.volumeInfo
      .authors
      ? data.volumeInfo.authors.join(", ")
      : "";
    console.log(data.volumeInfo.categories);
    document.querySelector("#addBookModal #genre").value = data.volumeInfo
      .categories
      ? data.volumeInfo.categories[0].split("/").map((genre) => genre.trim())[0]
      : "";
    document.querySelector("#addBookModal #publishedYear").value =
      parseInt(data.volumeInfo.publishedDate.slice(0, 5)) || "";
    document.querySelector("#addBookModal #publisher").value =
      data.volumeInfo.publisher || "";
    document.querySelector("#addBookModal #pages").value =
      parseInt(data.volumeInfo.pageCount) || "";
    document.querySelector("#addBookModal #summary").value =
      data.volumeInfo.description || "";
    document.querySelector("#addBookModal #isbn").value =
      data.volumeInfo.industryIdentifiers[0].identifier ||
      data.volumeInfo.industryIdentifiers[1].identifier;
  }
}

async function openModal(id, textContent) {
  if (id) {
    try {
      const response = await axios.get(`/api/fetchBookById/${id}`);
      const data = response.data;

      if (textContent) {
        await fillData(data, true);
        const googleBooksLink = data.volumeInfo.infoLink || "#";
        document.getElementById("modal-link").href = googleBooksLink;
        document.getElementById("modal").style.display = "flex"; // Show the modal
      } else {
        await fillData(data, false);
        document.getElementById("addBookModal").style.display = "flex"; // Show add book modal
      }
    } catch (error) {
      console.error("Error fetching book data:", error);
    }
  }
}

// Close the modal
function closeModal() {
  document.getElementById("modal").style.display = "none";
  document.getElementById("addBookModal").style.display = "none";
}

// Open/Close Modal Logic
const addBookModal = document.getElementById("addBookModal");
const openModalButton = document.getElementById("openAddBookButton");
const closeModalButton = document.getElementById("closeAddBookModal");
const cancelButton = document.getElementById("cancelButton");

// Close Modal
closeModalButton.onclick = () => (addBookModal.style.display = "none");
clearForm();
cancelButton.onclick = () => (addBookModal.style.display = "none");
clearForm();

// Combined window.onclick for outside click
window.onclick = function (event) {
  if (
    event.target == document.getElementById("modal") ||
    event.target == addBookModal
  ) {
    closeModal();
  }
};
