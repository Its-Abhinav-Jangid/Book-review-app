const editBookModal = document.getElementById("editBookModal");
const openModalButton = document.getElementById("editBookBtn");
const closeModalButton = document.querySelector(".close-btn");
const cancelButton = document.getElementById("cancelButton");
const modalBackground = document.getElementById("modal-background");
const deleteBookModal = document.getElementById("deleteBookModal");

function showDeleteWarning() {
	deleteBookModal.style.display = "flex";
	modalBackground.style.display = "block";
}

function hideDeleteWarning() {
	deleteBookModal.style.display = "none";
	modalBackground.style.display = "none";
}

async function fillData(data) {
	document.querySelector("#editBookModal #cover_image_url").value =
		data.cover_image_url;

	document.querySelector("#editBookModal #bookTitle").value =
		data.title || "";
	document.querySelector("#editBookModal #author").value = data.author;

	document.querySelector("#editBookModal #genre").value = data.genre;
	document.querySelector("#editBookModal #rating").value =
		parseInt(data.rating) || "";
	document.querySelector("#editBookModal #publishedYear").value =
		parseInt(data.published_year) || "";
	document.querySelector("#editBookModal #publisher").value =
		data.publisher || "";
	document.querySelector("#editBookModal #pages").value =
		parseInt(data.pages) || "";
	document.querySelector("#editBookModal #description").value =
		data.description || "";
	document.querySelector("#editBookModal #notes").value = data.notes || "";
	document.querySelector("#editBookModal #review").value = data.review || "";
	document.querySelector("#editBookModal #isbn").value = data.isbn;
}

async function openModal(data) {
	data = JSON.parse(data.getAttribute("data"));

	await fillData(data);

	editBookModal.style.display = "flex";
	modalBackground.style.display = "block";
}

// Close the modal
function closeModal() {
	editBookModal.style.display = "none";
	modalBackground.style.display = "none";
}
modalBackground.onclick = () => {
	closeModal();
	hideDeleteWarning();
};

async function deleteBook(bookId) {
	try {
		// Send DELETE request
		const response = await fetch("/book", {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ id: bookId }),
		});

		if (response.ok) {
			location.href = "/"; // Redirect to homepage or another page
		} else {
			const errorData = await response.json();
			alert(
				errorData.message ||
					"We encountered an issue while trying to delete the book. Please try again later."
			);
		}
	} catch (error) {
		console.error("Error:", error);
		alert(
			"An unexpected error occurred. Please check your internet connection or try again later."
		);
	}
}
