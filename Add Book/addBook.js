const addBookModal = document.getElementById("addBookModal");
const openModalButton = document.getElementById("openAddBookButton");
const closeModalButton = document.getElementById("closeAddBookModal");
const cancelButton = document.getElementById("cancelButton");
const modalBackground = document.getElementById("modal-background");

// const testData = {
//   volumeInfo: {
//     averageRating: 4,
//     title: "The pragmatic programmer",
//     authors: ["Andrew Hunt", "David Thomas"],
//     categories: ["programming"],
//     publishedDate: "2018-12-2",
//     pageCount: 300,
//     publisher: "Pearson",
//     description:
//       "lorem ipsum bla bla fdfgshed gf dfyg gfsdf ydgydsfd f gfgdyf dsgfdsg gfydyfds dgf sdgfusgufgu dsg udgfu dsgugudsgfugdus fsd gfugdsfgsd fus gdsufgudsfg udsgf dsfgsuidgfgdsuf dsfugsd ugfdsufg sdugfuisdgfui dgsuf dsgfud gfugdusfggdsgfdgsufds dsgfugs dfgsd fdgusg fuds",
//     industryIdentifiers: [{ identifier: "dfsgsdgd" }],
//   },
// };

async function fillData(data, textContent) {
  // For viewing data (textContent = true)
  let stars = "";
  if (textContent) {
    for (let i = 1; i <= 5; i++) {
      if (i <= data.volumeInfo.averageRating) {
        stars += `<i class="fa-solid fa-star"></i>`;
      } else {
        stars += `<i class="fa-regular fa-star"></i>`;
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
    document.getElementById("modal-rating").innerHTML = stars;
  }
  // For adding/editing data (textContent = false)
  else {
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

    document.querySelector("#addBookModal #genre").value = data.volumeInfo
      .categories
      ? data.volumeInfo.categories[0].split("/").map((genre) => genre.trim())[0]
      : "";
    document.querySelector("#addBookModal #rating").value =
      parseInt(data.volumeInfo.averageRating) || "";
    document.querySelector("#addBookModal #publishedYear").value =
      parseInt(data.volumeInfo.publishedDate.slice(0, 5)) || "";
    document.querySelector("#addBookModal #publisher").value =
      data.volumeInfo.publisher || "";
    document.querySelector("#addBookModal #pages").value =
      parseInt(data.volumeInfo.pageCount) || "";
    document.querySelector("#addBookModal #description").value =
      data.volumeInfo.description || "";
    document.querySelector("#addBookModal #isbn").value =
      data.volumeInfo.industryIdentifiers[0].identifier ||
      data.volumeInfo.industryIdentifiers[1].identifier;
  }
}

async function openModal(bookId, modalId) {
  if (bookId) {
    document.getElementById(modalId).style.display = "flex";
    modalBackground.style.display = "block";

    try {
      const response = await axios.get(`/api/fetchBookById/${bookId}`);
      const data = response.data;
      if (modalId === "modal") {
        await fillData(data, true);
        const googleBooksLink = data.volumeInfo.infoLink || "#";
        document.getElementById("modal-link").href = googleBooksLink;
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
  modalBackground.style.display = "none";
}

// Open/Close Modal Logic

// Close Modal
closeModalButton.onclick = () => closeModal();
cancelButton.onclick = () => closeModal();

// Combined window.onclick for outside click
modalBackground.onclick = () => {
  closeModal();
};
