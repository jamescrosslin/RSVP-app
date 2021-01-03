window.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registrar");
  const input = document.querySelector("#registrar input");
  const submitBtn = input.nextElementSibling;
  const ul = document.getElementById("invitedList");
  const tooltip = document.getElementById("errorTooltip").firstElementChild;
  const confirmedFilter = document.getElementById("confirmedFilter");

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
   * @param {String} name Invitee name
   * @param {String} notes Invitee notes
   * @param {Boolean=} RSVP Whether invitee confirmed
   * @returns {Element} List item
   */
  function createCard(name, notes, RSVP) {
    const li = makeElement("li", RSVP ? { "className": "responded" } : null);
    const nameSpan = makeElement("span", { "innerHTML": name });
    const label = makeElement("label", {
      "textContent": RSVP ? "Confirmed" : "Confirm",
    });
    const checkbox = makeElement("input", {
      "type": "checkbox",
      "checked": RSVP,
    });
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

  /**
   * @function isDuplicate
   * @param {String} name
   * @description Checks to see if the name that is about to be saved is a duplicate of any other invitees
   * @returns {Boolean}
   */
  function isDuplicate(name) {
    const spans = document.querySelectorAll("ul li span");
    const names = [...spans].map((span) => span.innerHTML.toLowerCase());
    return names.includes(name.toLowerCase());
  }

  function isValidInput(action) {
    if (input.value === "") {
      form.classList.add("error");
      return false;
    }
    if (isDuplicate(input.value)) {
      form.classList.add("error");
      tooltip.classList.add("showTooltip");
      return false;
    }
    if (form.classList.contains("error")) {
      form.classList.remove("error");
      tooltip.classList.remove("showTooltip");
    }
    return true;
  }

  function resetInput() {
    input.value = "";
    submitBtn.className = "disabled";
  }

  /**
   * @listens input
   * @description Checks for value of input on keyup to control accessibility
   */
  input.addEventListener("keyup", function (e) {
    const input = e.target;

    if (input.value != "") {
      isValidInput();
      return (submitBtn.className = "");
    }
    return resetInput();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!isValidInput()) return false;

    const li = createCard(input.value);
    ul.appendChild(li);

    resetInput();
    return data.setStorage();
  });

  /**
   * @function hideUnconfirmed
   * @param {Array} affectedElements An array of elements
   * @description Hides each of the elements given as a parameter
   */
  function hideUnconfirmed(affectedElements) {
    return affectedElements
      .filter((element) => {
        return !element.classList.contains("responded");
      })
      .forEach((element) => {
        element.classList.toggle("hidden");
      });
  }

  /**
   * @listens confirmedFilter
   * @description Listens for a check mark and hides unconfirmed guests from the list
   */
  confirmedFilter.addEventListener("change", (e) => {
    hideUnconfirmed([...ul.children]);
  });

  /**
   * @listens ul List item confirmation checkboxes will fire this event
   * @description Toggles whether an invitee has responded based on whether their "Confirm" box is checked
   */
  ul.addEventListener("change", (e) => {
    if (e.target.type == "checkbox") {
      const checkbox = e.target;
      const li = checkbox.parentNode.parentNode;
      li.classList.toggle("responded", checkbox.checked);
      checkbox.previousSibling.nodeValue == "Confirmed"
        ? (checkbox.previousSibling.nodeValue = "Confirm")
        : (checkbox.previousSibling.nodeValue = "Confirmed");
      if (confirmedFilter.checked) hideUnconfirmed([li]);
      data.setStorage();
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

      let nameElement;
      let notesElement;

      const nameActions = {
        remove: () => li.parentNode.removeChild(li),
        edit: () => {
          button.innerHTML = "Save";
          nameElement = makeElement("input", {
            "type": "text",
            "value": name.innerHTML,
          });
          li.replaceChild(nameElement, name);
          notesElement = makeElement("textarea", {
            "placeholder": "Add your notes here",
            "rows": "5",
            "className": "notes",
            "value": notes.innerHTML,
          });
          if (notesElement.value === "Add your notes here")
            notesElement.value = "";
          return li.replaceChild(notesElement, notes);
        },
        save: () => {
          console.log(name.value);
          if (isDuplicate(name.value))
            return alert("You've already entered a contact with that name!");
          nameElement = makeElement("span", { "innerHTML": name.value });
          button.innerHTML = "Edit";
          li.replaceChild(nameElement, name);
          notesElement = makeElement("p", {
            "className": "notes",
            "innerHTML": notes.value || "Add your notes here",
          });
          return li.replaceChild(notesElement, notes);
        },
      };
      if (nameActions[action]() && action != "edit") data.setStorage();
    }
  });

  /**
   * @name data
   * @constant {Object}
   * @description Contains methods relating to the storage of data
   */
  const data = {
    /**
     * @method validateStorage
     * @param {String="localStorage"} storageType localStorage or sessionStorage
     * @description Validates whether storage is available, be it session or local
     * @inner
     */
    validateStorage: (storageType = "localStorage") => {
      let storage;
      try {
        storage = window[storageType];
        const x = "__storage_test__";
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
      } catch (e) {
        alert(
          "You are browsing in a manner that has session or local storage disabled, e.g. in private mode or with Javascript features turned off. This page will not be able to save your data between sessions."
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

    /**
     * @method printStoredInvitees
     * @param {String="localStorage"} storageType localStorage or sessionStorage
     * @description Prints the stored invitees to the DOM
     * @inner
     */
    printStoredInvitees: (storageType = "localStorage") => {
      if (data.validateStorage(storageType) && window[storageType].invitees) {
        const storage = JSON.parse(window[storageType].invitees);
        for (const name in storage) {
          if (Object.hasOwnProperty.call(storage, name)) {
            const invitee = createCard(
              name,
              storage[name].notes,
              storage[name].responded
            );
            ul.appendChild(invitee);
          }
        }
      }
    },

    /**
     * @method setStorage
     * @param {String="localStorage"} storageType localStorage or sessionStorage
     * @description Sets invitee data to the client side storage
     * @inner
     */
    setStorage: (storageType = "localStorage") => {
      if (data.validateStorage(storageType)) {
        const lis = document.querySelectorAll("ul li");
        console.log(lis);
        const storage = {};
        lis.forEach((li) => {
          storage[li.firstElementChild.innerHTML] = {
            "responded": li.classList.contains("responded"),
            "notes": li.querySelector("p").innerHTML,
          };
        });
        return (window[storageType].invitees = JSON.stringify(storage));
      }
    },
  };

  data.printStoredInvitees();
});

window.onbeforeunload = function (event) {
  if (document.querySelectorAll('input[type="text"]').length > 1)
    return (event.returnValue =
      "You're about to leave the page without saving. Do you want to continue?");
};
