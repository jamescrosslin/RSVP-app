window.addEventListener("DOMContentLoaded", (event) => {
  const form = document.getElementById("registrar");
  const input = document.querySelector("#registrar input");
  const ul = document.getElementById("invitedList");
  const tooltip = document.getElementById("errorTooltip").firstElementChild;
  const isConfirmed = document.getElementById("confirmedFilter");

  const data = {
    validateStorage: (type = "localStorage") => {
      var storage;
      try {
        storage = window[type];
        var x = "__storage_test__";
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
      } catch (e) {
        alert(
          "You are browsing in a manner that has local storage disabled, e.g. in private mode or with Javascript features turned off. This page will not be able to save your data between screen refreshes."
        );
        return (
          e instanceof DOMException &&
          // everything except Firefox
          (e.code === 22 ||
            // Firefox
            e.code === 1014 ||
            // test name field too, because code might not be present
            // everything except Firefox
            e.name === "QuotaExceededError" ||
            // Firefox
            e.name === "NS_ERROR_DOM_QUOTA_REACHED") &&
          // acknowledge QuotaExceededError only if there's something already stored
          storage &&
          storage.length !== 0
        );
      }
    },
    getLocallyStoredInvitees: (storageType) => {
      if (data.validateStorage(storageType) && localStorage.invitees) {
        const storage = JSON.parse(localStorage.invitees);
        for (const name in storage) {
          if (Object.hasOwnProperty.call(storage, name)) {
            const invitee = createCard(
              name,
              storage[name].responded,
              storage[name].notes
            );
            ul.appendChild(invitee);
          }
        }
      }
    },
    setLocalStorage: (storageType) => {
      if (data.validateStorage(storageType)) {
        const lis = document.querySelectorAll("ul li");
        const storage = {};
        lis.forEach((li) => {
          storage[li.firstElementChild.innerHTML] = {
            "responded": li.classList.contains("responded"),
            "notes": li.querySelector("p").innerHTML,
          };
        });
        console.log(storage);
        localStorage.invitees = JSON.stringify(storage);
      }
    },
  };

  data.getLocallyStoredInvitees();

  /**
   * @function makeElement
   * @description Creates an element along with attributes
   * @param {String} elementTag The element type you want to create
   * @param {Object=} attributes Attributes and their values are passed in as property/value pairs
   * @returns {Element} The created element
   */
  function makeElement(elementTag, attributes) {
    const element = document.createElement(elementTag);
    if (attributes)
      for (let attribute in attributes) {
        element[attribute] = attributes[attribute] || "";
      }
    return element;
  }

  /**
   * @function createCard
   * @description Creates a card as a list item and inserts it into the DOM
   * @param {String} name
   * @param {Boolean=} RSVP
   * @returns {Element} List item
   */
  function createCard(name, RSVP, notes) {
    const li = makeElement("li");
    const nameSpan = makeElement("span", { "innerHTML": name });
    const label = makeElement("label", { "textContent": "Confirm" });
    const checkbox = makeElement("input", {
      "type": "checkbox",
    });

    if (RSVP) {
      checkbox.checked = "true";
      label.textContent = "Confirmed";
      li.className = "responded";
    }
    const notesP = makeElement("p", {
      "className": "notes",
      "innerHTML": notes || "Add your notes here",
    });

    const edit = makeElement("button", {
      "innerHTML": "Edit",
    });
    const remove = makeElement("button", {
      "innerHTML": "Remove",
    });

    label.appendChild(checkbox);
    li.append(nameSpan, label, notesP, edit, remove);
    return li;
  }

  function isDuplicate(name) {
    const spans = document.querySelectorAll("ul li span");
    const names = [...spans].map((span) => span.innerHTML);
    return names.includes(name);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (isDuplicate(input.value)) {
      form.classList.add("error");
      return tooltip.classList.add("showTooltip");
    }

    if (form.classList.contains("error")) form.classList.remove("error");
    if (tooltip.classList.contains("showTooltip"))
      tooltip.classList.remove("showTooltip");
    const text = input.value;
    input.value = "";

    const submitBtn = input.nextElementSibling;
    submitBtn.className = "disabled";

    const li = createCard(text);
    ul.appendChild(li);
    return data.setLocalStorage();
  });

  function hideUnconfirmed(affectedElements) {
    affectedElements
      .filter((li) => {
        return !li.classList.contains("responded");
      })
      .forEach((li) => {
        li.classList.toggle("hidden");
      });
  }

  /**
   * @listens filterContainer
   * @description Listens for a check mark and hides unconfirmed guests from the list
   */
  isConfirmed.addEventListener("change", (e) => {
    // const state = isConfirmed.checked
    hideUnconfirmed([...ul.children]);
  });

  /**
   * @listens ul
   * @description Toggles whether an invitee has responded based on whether their "Confirm" box is checked
   */
  ul.addEventListener("change", (e) => {
    if (e.target.type == "checkbox") {
      const checkbox = e.target;
      const li = checkbox.parentNode.parentNode;
      li.classList.toggle("responded", checkbox.checked);
      // label.childNodes.filter((node) => element.nodeType == Node.TEXT_NODE)[0] = "Confirmed"
      checkbox.previousSibling.nodeValue == "Confirmed"
        ? (checkbox.previousSibling.nodeValue = "Confirm")
        : (checkbox.previousSibling.nodeValue = "Confirmed");
      if (isConfirmed.checked) hideUnconfirmed([li]);
      data.setLocalStorage();
    }
  });

  /**
   * @listens ul
   * @description Edits invitee name or removes card based on which button is clicked
   */
  ul.addEventListener("click", (e) => {
    const button = e.target;
    if (button.tagName == "BUTTON") {
      const action = button.innerHTML.toLowerCase();
      const li = button.parentNode;
      const name = li.firstElementChild;
      const notes = li.querySelector(".notes");

      let nameField;
      let notesField;

      const nameActions = {
        remove: () => li.parentNode.removeChild(li),
        edit: () => {
          button.innerHTML = "Save";
          nameField = makeElement("input", {
            "type": "text",
            "value": name.innerHTML,
          });
          li.replaceChild(nameField, name);
          notesField = makeElement("textarea", {
            "placeholder": "Add your notes here",
            "rows": "5",
            "className": "notes",
            "value": notes.innerHTML,
          });
          if (notesField.value === "Add your notes here") notesField.value = "";
          return li.replaceChild(notesField, notes);
        },
        save: () => {
          console.log(name.value);
          if (isDuplicate(name.value))
            return alert("You've already entered a contact with that name!");
          nameField = makeElement("span", { "innerHTML": name.value });
          button.innerHTML = "Edit";
          li.replaceChild(nameField, name);
          notesField = makeElement("p", {
            "className": "notes",
            "innerHTML": notes.value || "Add your notes here",
          });
          return li.replaceChild(notesField, notes);
        },
      };
      if (nameActions[action]()) data.setLocalStorage();
    }
  });

  /**
   * @listens input
   * @description Disables submit button on empty input
   */
  input.addEventListener("keyup", function (e) {
    if (e.target.value != "") {
      e.target.nextElementSibling.className = "";
    } else {
      e.target.nextElementSibling.className = "disabled";
    }
  });
});

window.onbeforeunload = function (event) {
  if (document.querySelectorAll('input[type="text"]').length > 1)
    return (event.returnValue =
      "You're about to leave the page. Do you want to continue?");
};
