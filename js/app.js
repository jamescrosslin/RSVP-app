window.addEventListener("DOMContentLoaded", (event) => {
  const form = document.getElementById("registrar");
  const input = document.querySelector("#registrar input");
  const ul = document.getElementById("invitedList");
  const filterContainer = ul.previousElementSibling;

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
            const invitee = createCard(name, storage[name]);
            ul.appendChild(invitee);
          }
        }
      } else {
        alert(
          "You are browsing in a manner that has local storage disabled, e.g. in private mode or with Javascript features turned off. This page will not save your invitees across page loads."
        );
      }
    },
    setLocalStorage: (storageType) => {
      if (data.validateStorage(storageType)) {
        const lis = document.querySelectorAll("ul li");
        const storage = {};
        lis.forEach((li) => {
          storage[li.firstElementChild.innerHTML] = li.classList.contains(
            "responded"
          );
        });
        localStorage.invitees = JSON.stringify(storage);
      }
    },
  };

  data.getLocallyStoredInvitees();

  /**
   * @function makeElement
   * @description Creates an element along with attributes
   * @param {String} elementType The element type you want to create
   * @param {Object=} attributes Attributes and their values are passed in as property/value pairs
   * @returns {Element} The created element
   */
  function makeElement(elementType, attributes) {
    const element = document.createElement(elementType);
    if (attributes)
      for (let attribute in attributes) {
        element[attribute] = attributes[attribute];
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
  function createCard(name, RSVP) {
    const li = makeElement("li");
    const nameSpan = makeElement("span", { "innerHTML": name });
    const label = makeElement("label", { "textContent": "Confirmed" });
    const checkbox = makeElement("input", {
      "type": "checkbox",
    });

    if (RSVP) {
      checkbox.checked = "true";
      li.className = "responded";
    }
    console.log(typeof RSVP);
    const edit = makeElement("button", {
      "innerHTML": "Edit",
    });
    const remove = makeElement("button", {
      "innerHTML": "Remove",
    });

    label.appendChild(checkbox);
    li.append(nameSpan, label, edit, remove);
    return li;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (input.value != "") {
      const text = input.value;
      input.value = "";

      const submitBtn = input.nextElementSibling;
      submitBtn.className = "disabled";

      const li = createCard(text);
      ul.appendChild(li);
      data.setLocalStorage();
    }
  });

  /**
   * @listens filterContainer
   * @description Listens for a check mark and hides unconfirmed guests from the list
   */
  filterContainer.addEventListener("change", (e) => {
    [...ul.children]
      .filter((li) => !li.classList.contains("responded"))
      .forEach((li) => {
        li.classList.toggle("hidden");
      });
  });

  /**
   * @listens ul
   * @description Toggles whether an invitee has responded based on whether their "Confirmed" box is checked
   */
  ul.addEventListener("change", (e) => {
    const li = e.target.parentNode.parentNode;
    li.classList.toggle("responded", e.target.checked);
    data.setLocalStorage();
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
      const nameElement = li.firstElementChild;
      const name = nameElement.value ?? nameElement.innerHTML;
      let nameField;

      const nameActions = {
        remove: () => li.parentNode.removeChild(li),
        edit: () => {
          li.removeChild(nameElement);
          nameField = makeElement("input", { "type": "text", "value": name });
          button.innerHTML = "Save";
          li.prepend(nameField);
        },
        save: () => {
          li.removeChild(nameElement);
          nameField = makeElement("span", { "innerHTML": name });
          nameField.innerHTML = name;
          button.innerHTML = "Edit";
          li.prepend(nameField);
        },
      };
      nameActions[action]();
      data.setLocalStorage();
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
