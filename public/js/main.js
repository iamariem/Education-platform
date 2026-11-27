"use strict";

const eduLayoutReady =
  window.eduLayouts?.ready || Promise.resolve();

/* =========================================
   EduSaaS - Demo Account Verification
========================================= */

const eduVerification = {

  getAccount(email) {

    const key =
      "edusaas.account." + email.trim().toLowerCase();

    const savedAccount = localStorage.getItem(key);

    return savedAccount
      ? JSON.parse(savedAccount)
      : null;

  },

  saveAccount(email, role) {

    const normalizedEmail =
      email.trim().toLowerCase();

    const account = {
      email: normalizedEmail,
      role: role,
      emailVerified: false
    };

    localStorage.setItem(
      "edusaas.account." + normalizedEmail,
      JSON.stringify(account)
    );

    return account;

  },

  openVerification(email, source) {

    sessionStorage.setItem(
      "edusaas.verification",
      JSON.stringify({
        email: email.trim().toLowerCase(),
        source: source
      })
    );

    window.location.href = "EmailVerification.html";

  }

};

/* =========================================
   EduSaaS - Shared Page Features
========================================= */

document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* Animated Statistics */

  function animateCounter(element) {
    if (element.dataset.animated === "true") return;

    const target = Number(element.dataset.count);
    const suffix = element.dataset.suffix || "";
    const prefix = element.dataset.prefix || "";

    if (!Number.isFinite(target)) return;

    element.dataset.animated = "true";

    const formatter = new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    });

    if (reduceMotion) {
      element.textContent = prefix + formatter.format(target) + suffix;
      return;
    }

    const duration = 1600;
    const startTime = performance.now();

    function updateCounter(currentTime) {
      const progress = Math.min(
        (currentTime - startTime) / duration,
        1
      );

      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(target * easedProgress);

      element.textContent =
        prefix + formatter.format(currentValue) + suffix;

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        element.textContent =
          prefix + formatter.format(target) + suffix;
      }
    }

    requestAnimationFrame(updateCounter);
  }

  const counterElements = document.querySelectorAll("[data-count]");

  if ("IntersectionObserver" in window && !reduceMotion) {
    const counterObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          animateCounter(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.35 }
    );

    counterElements.forEach((element) => {
      counterObserver.observe(element);
    });
  } else {
    counterElements.forEach(animateCounter);
  }

  /* Reveal Elements on Scroll */

  const revealElements = document.querySelectorAll(".reveal");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealElements.forEach((element) => {
      element.classList.add("is-visible");
    });
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12 }
    );

    revealElements.forEach((element) => {
      revealObserver.observe(element);
    });
  }
});


/* =========================================
   Mobile Navigation Toggle
========================================= */

document.addEventListener("DOMContentLoaded", () => {
  eduLayoutReady.then(() => {
    const menuToggle = document.querySelector(".menu-toggle");
    const navbarMenu = document.getElementById("navbarMenu");

    if (!menuToggle || !navbarMenu) return;

    if (menuToggle.dataset.layoutInitialized === "true") return;
    menuToggle.dataset.layoutInitialized = "true";

    function setMenu(isOpen) {
      navbarMenu.classList.toggle("open", isOpen);
      menuToggle.classList.toggle("active", isOpen);

      menuToggle.setAttribute(
        "aria-expanded",
        String(isOpen)
      );

      menuToggle.setAttribute(
        "aria-label",
        isOpen
          ? "Close navigation menu"
          : "Open navigation menu"
      );
    }

    menuToggle.addEventListener("click", () => {
      const isOpen =
        menuToggle.getAttribute("aria-expanded") === "true";

      setMenu(!isOpen);
    });

    navbarMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        setMenu(false);
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setMenu(false);
      }
    });

    document.addEventListener("click", (event) => {
      if (
        !menuToggle.contains(event.target) &&
        !navbarMenu.contains(event.target)
      ) {
        setMenu(false);
      }
    });
  }).catch((error) => {
    console.error("Unable to initialize the landing navbar:", error);
  });
});


/* =========================================
   Sticky Navbar Scroll Effect
========================================= */

eduLayoutReady.then(() => {
  const navbar = document.querySelector(".navbar");

  if (!navbar) return;

  const updateNavbar = () => {
    navbar.classList.toggle("scrolled", window.scrollY > 20);
  };

  updateNavbar();

  window.addEventListener("scroll", updateNavbar, {
    passive: true,
  });
}).catch((error) => {
  console.error("Unable to initialize the landing navbar:", error);
});
/* =========================================
   EduSaaS — Multi-Step Signup & Email Confirmation
========================================= */

document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("signupForm");

  if (!form) return;

  const steps = [
    ...form.querySelectorAll("[data-signup-step]")
  ];

  const indicators = [
    ...form.querySelectorAll("[data-signup-indicator]")
  ];

  const nextButtons = [
    ...form.querySelectorAll("[data-signup-next]")
  ];

  const backButtons = [
    ...form.querySelectorAll("[data-signup-back]")
  ];

  const roleInputs = [
    ...form.querySelectorAll('input[name="role"]')
  ];

  const emailInput = document.getElementById("signupEmail");
  const passwordInput = document.getElementById("signupPassword");
  const passwordError = document.getElementById("passwordError");
  const signupMessage = document.getElementById("signupMessage");

  const confirmationScreen = document.getElementById(
    "emailConfirmationScreen"
  );

  const confirmationEmail = document.getElementById(
    "confirmationEmailAddress"
  );

  const confirmationFeedback = document.getElementById(
    "confirmationFeedback"
  );

  const resendButton = document.getElementById(
    "resendConfirmationBtn"
  );

  const backToSignupButton = document.getElementById(
    "backToSignupBtn"
  );

  const openEmailButton = document.getElementById(
    "openEmailAppBtn"
  );

  const authLayout = document.querySelector(".auth-layout");

  const authFormWrapper = document.querySelector(
    ".auth-form-wrapper"
  );

  const signupProgress = form.querySelector(".signup-progress");

  let currentStep = 0;
  let currentEmail = "";


  /* =========================================
     Account Role
  ========================================= */

  function selectedValue(inputs) {

    return inputs.find(
      (input) => input.checked
    )?.value || "";

  }


  /* =========================================
     Progress Visibility
  ========================================= */

  function updateProgressVisibility() {

    const isTeacher =
      selectedValue(roleInputs) === "teacher";

    if (signupProgress) {

      signupProgress.style.display =
        isTeacher ? "none" : "";

    }

    const signupSubtitle = document.getElementById(
      "signupSubtitle"
    );

    if (signupSubtitle) {

      signupSubtitle.style.display =
        isTeacher ? "" : "none";

    }

  }


  /* =========================================
     Enable Active Form Fields
  ========================================= */

  function setPanelEnabled(panel, enabled) {

    if (!panel) return;

    panel.querySelectorAll(
      "input, select, textarea"
    ).forEach((field) => {

      field.disabled = !enabled;

    });

  }


  /* =========================================
     Form Validation Styles
  ========================================= */

  function checkSignupFields() {

    const fields = form.querySelectorAll(
      'input[required]:not(:disabled), select[required]:not(:disabled), textarea[required]:not(:disabled)'
    );

    fields.forEach((field) => {

      const invalid = !field.checkValidity();

      field.classList.toggle(
        "is-invalid",
        invalid
      );

    });

  }

  form.addEventListener("click", (event) => {

    const button = event.target.closest("button");

    if (
      button &&
      button.textContent.trim().toLowerCase().includes("create")
    ) {

      checkSignupFields();

    }

  });

  form.addEventListener("input", (event) => {

    if (event.target.matches("input, select, textarea")) {

      event.target.classList.toggle(
        "is-invalid",
        !event.target.checkValidity()
      );

    }

  });

  form.addEventListener("change", (event) => {

    if (event.target.matches("input, select, textarea")) {

      event.target.classList.toggle(
        "is-invalid",
        !event.target.checkValidity()
      );

    }

  });


  /* =========================================
     Display Signup Step
  ========================================= */

  function showStep(index) {

    currentStep = Math.max(
      0,
      Math.min(index, steps.length - 1)
    );

    steps.forEach((step, i) => {

      const isActive = i === currentStep;

      step.hidden = !isActive;

      step.classList.toggle(
        "active",
        isActive
      );

      setPanelEnabled(step, isActive);

    });

    if (currentStep === 0) {

      setPanelEnabled(steps[0], true);

    }

    updateProgressVisibility();

    indicators.forEach((indicator, i) => {

      indicator.classList.toggle(
        "active",
        i === currentStep
      );

      indicator.classList.toggle(
        "completed",
        i < currentStep
      );

      if (i === currentStep) {

        indicator.setAttribute(
          "aria-current",
          "step"
        );

      } else {

        indicator.removeAttribute(
          "aria-current"
        );

      }

    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }


  /* =========================================
     Validate Current Step
  ========================================= */

  function validateCurrentStep() {

    const activeStep = steps[currentStep];

    if (!activeStep) return false;

    /* STEP 1: ACCOUNT TYPE */

    if (currentStep === 0) {

      if (!selectedValue(roleInputs)) {

        form.reportValidity();

        return false;

      }

      return true;

    }

    /* STEP 2: PERSONAL INFORMATION */

    const requiredFields = [
      ...activeStep.querySelectorAll(
        "input[required], select[required]"
      )
    ];

    const firstInvalid = requiredFields.find(
      (field) =>
        !field.disabled &&
        !field.checkValidity()
    );

    if (firstInvalid) {

      firstInvalid.reportValidity();

      firstInvalid.focus();

      return false;

    }

    if (
      passwordInput &&
      passwordInput.value.length < 8
    ) {

      if (passwordError) {

        passwordError.hidden = false;

      }

      passwordInput.focus();

      return false;

    }

    if (passwordError) {

      passwordError.hidden = true;

    }

    return true;

  }


  /* =========================================
     Email Provider
  ========================================= */

  function updateEmailProviderLink() {

    if (!openEmailButton) return;

    const domain = currentEmail
      .split("@")[1]
      ?.toLowerCase();

    let url = "https://mail.google.com/";

    if (
      ["outlook.com", "hotmail.com", "live.com"]
        .includes(domain)
    ) {

      url = "https://outlook.live.com/mail/";

    } else if (
      ["yahoo.com", "yahoo.co.uk"]
        .includes(domain)
    ) {

      url = "https://mail.yahoo.com/";

    }

    openEmailButton.href = url;

  }


  /* =========================================
     Email Confirmation Screen
  ========================================= */

  function showConfirmationScreen(email) {

    currentEmail = email.trim();

    if (confirmationEmail) {

      confirmationEmail.textContent =
        currentEmail;

    }

    if (confirmationFeedback) {

      confirmationFeedback.textContent =
        "Demo mode: Email verification is not connected yet. No email has been sent.";

    }

    if (signupMessage) {

      signupMessage.textContent = "";

    }

    if (confirmationScreen) {

      confirmationScreen.hidden = false;

    }

    authLayout?.classList.add(
      "showing-confirmation"
    );

    if (authFormWrapper) {

      authFormWrapper.hidden = true;

    }

    form.hidden = true;

    updateEmailProviderLink();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }


  /* =========================================
     Back To Signup
  ========================================= */

  function returnToSignup() {

    if (confirmationScreen) {

      confirmationScreen.hidden = true;

    }

    authLayout?.classList.remove(
      "showing-confirmation"
    );

    if (authFormWrapper) {

      authFormWrapper.hidden = false;

    }

    form.hidden = false;

    if (confirmationFeedback) {

      confirmationFeedback.textContent = "";

    }

    showStep(1);

  }


  /* =========================================
     Preserve Personal Information By Role
  ========================================= */

  const personalFieldIds = [
    "signupFirstName",
    "signupLastName",
    "signupEmail",
    "signupnumber",
    "signupPassword"
  ];

  function getPersonalInfo() {

    const data = {};

    personalFieldIds.forEach((id) => {

      const field = document.getElementById(id);

      if (field) {

        data[id] = field.value;

      }

    });

    const terms = form.querySelector(
      ".terms-check input"
    );

    if (terms) {

      data.terms = terms.checked;

    }

    return data;

  }

  function setPersonalInfo(data) {

    personalFieldIds.forEach((id) => {

      const field = document.getElementById(id);

      if (field) {

        field.value = data[id] || "";

      }

    });

    const terms = form.querySelector(
      ".terms-check input"
    );

    if (terms) {

      terms.checked = data.terms || false;

    }

  }

  let currentPersonalRole =
    selectedValue(roleInputs);

  const personalInfoByRole = {

    student:
      currentPersonalRole === "student"
        ? getPersonalInfo()
        : null,

    teacher:
      currentPersonalRole === "teacher"
        ? getPersonalInfo()
        : null

  };

  roleInputs.forEach((input) => {

    input.addEventListener("change", () => {

      if (currentPersonalRole) {

        personalInfoByRole[currentPersonalRole] =
          getPersonalInfo();

      }

      const newRole = selectedValue(roleInputs);

      if (newRole) {

        setPersonalInfo(
          personalInfoByRole[newRole] || {}
        );

      }

      currentPersonalRole = newRole;

    });

  });


  /* =========================================
     Continue Button
  ========================================= */

  nextButtons.forEach((button) => {

    button.addEventListener("click", () => {

      if (
        currentStep === 0 &&
        validateCurrentStep()
      ) {

        showStep(1);

      }

    });

  });


  /* =========================================
     Back Button
  ========================================= */

  backButtons.forEach((button) => {

    button.addEventListener("click", () => {

      showStep(0);

    });

  });

  /* =========================================
     Create Account
  ========================================= */

  form.addEventListener("submit", (event) => {

    event.preventDefault();

    if (
      currentStep !== 1 ||
      !validateCurrentStep()
    ) {
      return;
    }

    const email =
      emailInput?.value.trim().toLowerCase() || "";

    if (!email) {
      emailInput?.focus();
      return;
    }

    const role = selectedValue(roleInputs);

    try {

      const existingAccount =
        eduVerification.getAccount(email);

      if (existingAccount) {

        if (signupMessage) {

          signupMessage.textContent =
            "An account with this email already exists. Please log in.";

          signupMessage.className =
            "auth-message is-visible is-error";

        }

        return;

      }

      eduVerification.saveAccount(email, role);

      eduVerification.openVerification(
        email,
        "signup"
      );

    } catch (error) {

      if (signupMessage) {

        signupMessage.textContent =
          "Unable to save your account. Please try again.";

        signupMessage.className =
          "auth-message is-visible is-error";

      }

    }

  });
  /* =========================================
     Password Validation
  ========================================= */

  passwordInput?.addEventListener("input", () => {

    if (
      passwordInput.value.length >= 8 &&
      passwordError
    ) {

      passwordError.hidden = true;

    }

  });


  /* =========================================
     Confirmation Back Button
  ========================================= */

  if (backToSignupButton) {

    backToSignupButton.addEventListener(
      "click",
      returnToSignup
    );

  }


  /* =========================================
     Resend Confirmation
  ========================================= */

  resendButton?.addEventListener("click", () => {

    if (confirmationFeedback) {

      confirmationFeedback.textContent =
        currentEmail
          ? "Resending isn't connected yet. No email has been sent."
          : "Please return to the signup form and enter your email.";

    }

  });


  /* =========================================
     Google Signup
  ========================================= */

  const googleSignupButton = document.getElementById(
    "googleSignupBtn"
  );

  const googleSignupMessage = document.getElementById(
    "googleSignupMessage"
  );

  googleSignupButton?.addEventListener("click", () => {

    if (googleSignupMessage) {

      googleSignupMessage.textContent =
        "Google Sign-In isn't connected yet.";

    }

  });


  /* =========================================
     Initial State
  ========================================= */

  showStep(0);

});
/* =========================================
   EduSaaS — Login
========================================= */

document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("loginForm");
  const email = document.getElementById("loginEmail");
  const password = document.getElementById("loginPassword");
  const message = document.getElementById("loginMessage");
  const googleButton = document.getElementById("googleLoginBtn");
  const googleMessage = document.getElementById("googleLoginMessage");
  const forgotLink = document.querySelector(".forgot-password-link");

  if (!form) return;

  function showMessage(text, type = "error") {
    if (!message) return;

    message.textContent = text;

    message.className =
      "auth-message is-visible " +
      (type === "success" ? "is-success" : "is-error");
  }

  function clearMessage() {
    if (!message) return;

    message.textContent = "";
    message.className = "auth-message";
  }

  /* LOGIN FORM */

  form.addEventListener("submit", (event) => {

    event.preventDefault();

    clearMessage();

    if (!email || !email.value.trim() || !email.validity.valid) {
      showMessage("Please enter a valid email address.");
      email?.focus();
      return;
    }

    if (!password || !password.value) {
      showMessage("Please enter your password.");
      password?.focus();
      return;
    }

    /* CHECK ACCOUNT VERIFICATION */

    const normalizedEmail =
      email.value.trim().toLowerCase();

    try {

      const account =
        eduVerification.getAccount(normalizedEmail);

      if (!account) {

        showMessage(
          "No account found. Please create an account first."
        );

        return;

      }

      if (account.emailVerified !== true) {

        eduVerification.openVerification(
          normalizedEmail,
          "login"
        );

        return;

      }

      if (account.role === "student") {

        window.location.href = "../student/StudentDashboard.html";

        return;

      }

      showMessage(
        "The teacher dashboard is not available yet."
      );

    } catch (error) {

      showMessage(
        "Unable to access your account. Please try again."
      );

    }
  });
  /* CLEAR VALIDATION MESSAGES */

  email?.addEventListener("input", clearMessage);
  password?.addEventListener("input", clearMessage);

  /* GOOGLE LOGIN */

  if (googleButton) {
    googleButton.addEventListener("click", () => {
      if (googleMessage) {
        googleMessage.textContent =
          "Google sign-in has not been connected yet.";
      }
    });
  }

  /* FORGOT PASSWORD */

  if (forgotLink) {
    forgotLink.addEventListener("click", (event) => {
      event.preventDefault();

      showMessage(
        "Password reset is not available yet."
      );
    });
  }

});


/* =========================================
   EduSaaS — Student Registration
========================================= */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("studentRegistrationForm");

  if (!form) return;

  const steps = [
    ...form.querySelectorAll(".registration-form-step")
  ];

  const indicators = [
    ...document.querySelectorAll("[data-step-indicator]")
  ];

  const nextButtons = [
    ...form.querySelectorAll("[data-next-step]")
  ];

  const previousButtons = [
    ...form.querySelectorAll("[data-previous-step]")
  ];

  const subjectInputs = [
    ...form.querySelectorAll('input[name="subjects"]')
  ];

  const selectAllButton = document.getElementById("selectAllSubjects");

  const notificationButton = document.getElementById(
    "registrationNotificationBtn"
  );

  const profileButton = document.getElementById(
    "registrationProfileBtn"
  );

  let currentStep = 0;

  const registrationContainer = document.querySelector(
    ".registration-container"
  );

  const confirmationScreen = document.getElementById(
    "studentEmailConfirmationScreen"
  );

  const confirmationEmail = document.getElementById(
    "studentConfirmationEmail"
  );

  const confirmationFeedback = document.getElementById(
    "studentConfirmationFeedback"
  );

  const resendEmailButton = document.getElementById(
    "studentResendEmailBtn"
  );

  const openEmailButton = document.getElementById(
    "studentOpenEmailBtn"
  );

  let registeredEmail = "";

  /* Field validation helpers */

  function getErrorElement(fieldId) {
    return document.querySelector(
      `[data-error-for="${fieldId}"]`
    );
  }

  function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorElement = getErrorElement(fieldId);

    if (field) {
      field.setAttribute("aria-invalid", "true");
    }

    if (errorElement) {
      errorElement.textContent = message;
    }
  }

  function clearError(fieldId) {
    const field = document.getElementById(fieldId);
    const errorElement = getErrorElement(fieldId);

    if (field) {
      field.removeAttribute("aria-invalid");
    }

    if (errorElement) {
      errorElement.textContent = "";
    }
  }

  function clearStepErrors(stepElement) {
    stepElement.querySelectorAll("[data-error-for]").forEach((element) => {
      const fieldId = element.dataset.errorFor;
      clearError(fieldId);
    });
  }

  function validateRequiredField(fieldId, message) {
    const field = document.getElementById(fieldId);

    if (!field) return false;

    if (!field.value.trim()) {
      showError(fieldId, message);
      return false;
    }

    clearError(fieldId);
    return true;
  }

  function validateEmailField(fieldId, emptyMessage, invalidMessage) {
    const field = document.getElementById(fieldId);

    if (!field) return false;

    const email = field.value.trim();

    if (!email) {
      showError(fieldId, emptyMessage);
      return false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      showError(fieldId, invalidMessage);
      return false;
    }

    clearError(fieldId);
    return true;
  }

  function validateEmail() {
    return validateEmailField(
      "studentEmail",
      "Please enter your email address.",
      "Please enter a valid email address."
    );
  }

  function validateParentEmail() {
    return validateEmailField(
      "parentEmail",
      "Please enter parent's email address.",
      "Please enter a valid parent email address."
    );
  }

  function validatePhoneField(fieldId, emptyMessage, invalidMessage) {
    const field = document.getElementById(fieldId);

    if (!field) return false;

    const phone = field.value.trim();

    if (!phone) {
      showError(fieldId, emptyMessage);
      return false;
    }

    if (!/^[+]?[\d\s()-]{7,20}$/.test(phone)) {
      showError(fieldId, invalidMessage);
      return false;
    }

    clearError(fieldId);
    return true;
  }

  function validateStudentPhone() {
    return validatePhoneField(
      "studentPhone",
      "Student phone number is required.",
      "Please enter a valid student phone number."
    );
  }

  function validateParentPhone() {
    return validatePhoneField(
      "parentPhone",
      "Please enter parent's phone number.",
      "Please enter a valid parent phone number."
    );
  }

  function validatePasswords() {
    const password = document.getElementById("studentPassword");

    const confirmPassword = document.getElementById(
      "studentConfirmPassword"
    );

    if (!password || !confirmPassword) return false;

    let valid = true;

    if (password.value.length < 8) {
      showError(
        "studentPassword",
        "Your password must contain at least 8 characters."
      );
      valid = false;
    } else {
      clearError("studentPassword");
    }

    if (!confirmPassword.value) {
      showError(
        "studentConfirmPassword",
        "Please confirm your password."
      );
      valid = false;
    } else if (password.value !== confirmPassword.value) {
      showError(
        "studentConfirmPassword",
        "The passwords do not match."
      );
      valid = false;
    } else {
      clearError("studentConfirmPassword");
    }

    return valid;
  }

  function validateTerms() {
    const terms = document.getElementById("studentTerms");

    if (!terms) return false;

    if (!terms.checked) {
      showError("studentTerms", "Please accept the terms to continue.");
      return false;
    }

    clearError("studentTerms");
    return true;
  }

  function validateStep(stepIndex) {
    const step = steps[stepIndex];

    if (!step) return false;

    clearStepErrors(step);

    if (stepIndex === 0) {
      const firstNameValid = validateRequiredField(
        "studentFirstName",
        "Please enter your first name."
      );

      const lastNameValid = validateRequiredField(
        "studentLastName",
        "Please enter your last name."
      );

      const emailValid = validateEmail();
      const studentPhoneValid = validateStudentPhone();
      const parentPhoneValid = validateParentPhone();
      const parentEmailValid = validateParentEmail();
      const passwordsValid = validatePasswords();
      const termsValid = validateTerms();

      return (
        firstNameValid &&
        lastNameValid &&
        emailValid &&
        studentPhoneValid &&
        parentPhoneValid &&
        parentEmailValid &&
        passwordsValid &&
        termsValid
      );
    }

    if (stepIndex === 1) {
      const gradeValid = validateRequiredField(
        "studentGrade",
        "Please select your grade."
      );

      const selectedSubjects = subjectInputs.filter(
        (input) => input.checked
      );

      if (selectedSubjects.length === 0) {
        showError(
          "studentSubjects",
          "Please select at least one subject."
        );
      } else {
        clearError("studentSubjects");
      }

      return gradeValid && selectedSubjects.length > 0;
    }

    if (stepIndex === 2) {
      const schoolValid = validateRequiredField(
        "studentSchool",
        "Please enter your school name."
      );

      const schoolTypeValid = validateRequiredField(
        "studentSchoolType",
        "Please select your school type."
      );

      const countryValid = validateRequiredField(
        "studentCountry",
        "Please select your country."
      );

      const cityValid = validateRequiredField(
        "studentCity",
        "Please enter your city."
      );

      return (
        schoolValid &&
        schoolTypeValid &&
        countryValid &&
        cityValid
      );
    }

    return true;
  }

  /* Move between steps */

  function showStep(stepIndex) {
    if (steps.length === 0) return;

    currentStep = Math.max(
      0,
      Math.min(stepIndex, steps.length - 1)
    );

    steps.forEach((step, index) => {
      const isActive = index === currentStep;

      step.hidden = !isActive;
      step.classList.toggle("active", isActive);
    });

    indicators.forEach((indicator, index) => {
      indicator.classList.toggle("active", index === currentStep);
      indicator.classList.toggle("completed", index < currentStep);

      if (index === currentStep) {
        indicator.setAttribute("aria-current", "step");
      } else {
        indicator.removeAttribute("aria-current");
      }
    });

    updateSelectAllLabel();

    window.scrollTo({
      top: 0,
      behavior: window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
        ? "auto"
        : "smooth",
    });
  }

  nextButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (!validateStep(currentStep)) {
        const firstInvalid = steps[currentStep]?.querySelector(
          '[aria-invalid="true"]'
        );

        firstInvalid?.focus();
        return;
      }

      if (currentStep === 2) {
        updateReview();
      }

      showStep(currentStep + 1);
    });
  });

  previousButtons.forEach((button) => {
    button.addEventListener("click", () => {
      showStep(currentStep - 1);
    });
  });

  /* Subject selection */

  function updateSelectAllLabel() {
    if (!selectAllButton || subjectInputs.length === 0) return;

    const allSelected = subjectInputs.every(
      (input) => input.checked
    );

    selectAllButton.textContent = allSelected
      ? "Deselect All"
      : "Select All";
  }

  if (selectAllButton) {
    selectAllButton.addEventListener("click", () => {
      const allSelected = subjectInputs.every(
        (input) => input.checked
      );

      subjectInputs.forEach((input) => {
        input.checked = !allSelected;
      });

      if (subjectInputs.some((input) => input.checked)) {
        clearError("studentSubjects");
      }

      updateSelectAllLabel();
    });
  }

  subjectInputs.forEach((input) => {
    input.addEventListener("change", () => {
      if (subjectInputs.some((subject) => subject.checked)) {
        clearError("studentSubjects");
      }

      updateSelectAllLabel();
    });
  });

  /* Review information */

  function setReviewValue(elementId, value) {
    const element = document.getElementById(elementId);

    if (element) {
      element.textContent = value || "—";
    }
  }

  function updateReview() {
    const selectedSubjects = subjectInputs
      .filter((input) => input.checked)
      .map((input) => input.value);

    const firstName =
      document.getElementById("studentFirstName")?.value.trim() || "";

    const lastName =
      document.getElementById("studentLastName")?.value.trim() || "";

    const studentPhone =
      document.getElementById("studentPhone")?.value.trim() || "";

    const parentPhone =
      document.getElementById("parentPhone")?.value.trim() || "";

    const parentEmail =
      document.getElementById("parentEmail")?.value.trim() || "";

    const school =
      document.getElementById("studentSchool")?.value.trim() || "";

    const schoolType =
      document.getElementById("studentSchoolType")?.value || "";

    const country =
      document.getElementById("studentCountry")?.value || "";

    const city =
      document.getElementById("studentCity")?.value.trim() || "";

    setReviewValue("reviewFirstName", firstName);
    setReviewValue("reviewLastName", lastName);
    setReviewValue("reviewStudentPhone", studentPhone);
    setReviewValue("reviewParentPhone", parentPhone);
    setReviewValue("reviewParentEmail", parentEmail);

    setReviewValue(
      "reviewEmail",
      document.getElementById("studentEmail")?.value.trim() || ""
    );

    setReviewValue(
      "reviewGrade",
      document.getElementById("studentGrade")?.value || ""
    );

    setReviewValue("reviewSubjects", selectedSubjects.join(", "));
    setReviewValue("reviewSchool", school);
    setReviewValue("reviewSchoolType", schoolType);

    setReviewValue(
      "reviewLocation",
      [country, city].filter(Boolean).join(" / ")
    );
  }
  /* Final Form Submission */
  form.addEventListener("submit", (event) => {

    event.preventDefault();

    if (
      currentStep !== 3 ||
      !validateStep(0) ||
      !validateStep(1) ||
      !validateStep(2)
    ) {
      return;
    }

    updateReview();

    registeredEmail =
      document.getElementById("studentEmail")?.value.trim() || "";

    if (
      !registrationContainer ||
      !confirmationScreen ||
      !confirmationEmail
    ) {
      return;
    }

    confirmationEmail.textContent = registeredEmail;

    if (confirmationFeedback) {
      confirmationFeedback.textContent =
        "Demo mode: No verification email has been sent.";
    }

    const emailDomain = registeredEmail
      .split("@")[1]
      ?.toLowerCase();

    let emailUrl = "https://mail.google.com/";

    if (
      emailDomain === "outlook.com" ||
      emailDomain === "hotmail.com" ||
      emailDomain === "live.com"
    ) {
      emailUrl = "https://outlook.live.com/mail/";
    } else if (emailDomain === "yahoo.com") {
      emailUrl = "https://mail.yahoo.com/";
    }

    if (openEmailButton) {
      openEmailButton.href = emailUrl;
    }

    registrationContainer.hidden = true;
    confirmationScreen.hidden = false;

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  });

  /* Resend confirmation (demo only) */

  if (resendEmailButton) {
    resendEmailButton.addEventListener("click", () => {
      if (confirmationFeedback) {
        confirmationFeedback.textContent =
          "Resending is not connected yet. No email has been sent.";
      }
    });
  }

  /* Clear field errors while correcting input */

  [
    "studentFirstName",
    "studentLastName",
    "studentEmail",
    "studentPhone",
    "parentPhone",
    "parentEmail",
    "studentPassword",
    "studentConfirmPassword",
    "studentGrade",
    "studentSchool",
    "studentSchoolType",
    "studentCountry",
    "studentCity",
  ].forEach((fieldId) => {
    const field = document.getElementById(fieldId);

    if (!field) return;

    const eventName =
      field.tagName === "SELECT" ? "change" : "input";

    field.addEventListener(eventName, () => {
      if (field.value.trim()) {
        clearError(fieldId);
      }

      if (fieldId === "studentEmail") {
        validateEmail();
      }

      if (fieldId === "parentEmail") {
        validateParentEmail();
      }

      if (fieldId === "studentPhone") {
        validateStudentPhone();
      }

      if (fieldId === "parentPhone") {
        validateParentPhone();
      }

      if (
        fieldId === "studentPassword" ||
        fieldId === "studentConfirmPassword"
      ) {
        const password = document.getElementById("studentPassword");

        const confirmPassword = document.getElementById(
          "studentConfirmPassword"
        );

        if (
          password &&
          confirmPassword &&
          password.value &&
          confirmPassword.value &&
          password.value === confirmPassword.value
        ) {
          clearError("studentPassword");
          clearError("studentConfirmPassword");
        }
      }
    });
  });

  document.getElementById("studentTerms")?.addEventListener(
    "change",
    () => {
      if (document.getElementById("studentTerms")?.checked) {
        clearError("studentTerms");
      }
    }
  );

  /* Navbar buttons */

  if (notificationButton) {
    notificationButton.addEventListener("click", () => {
      notificationButton.setAttribute(
        "aria-label",
        "Notifications: no new notifications"
      );

      const dot = notificationButton.querySelector(
        ".registration-notification-dot"
      );

      if (dot) {
        dot.hidden = true;
      }
    });
  }

  if (profileButton) {
    profileButton.addEventListener("click", () => {
      const existingMessage = document.getElementById(
        "registrationProfileMessage"
      );

      if (existingMessage) {
        existingMessage.remove();
        profileButton.setAttribute("aria-expanded", "false");
        return;
      }

      const message = document.createElement("div");

      message.id = "registrationProfileMessage";
      message.className = "registration-profile-message";

      message.textContent =
        "Your profile will be available after sign in.";

      message.setAttribute("role", "status");

      profileButton.insertAdjacentElement("afterend", message);
      profileButton.setAttribute("aria-expanded", "true");
    });
  }

  /* Initial state */

  showStep(0);
});

/* =========================================
   Password Visibility Toggle
========================================= */

document.querySelectorAll("[data-password-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    const inputId = button.dataset.passwordToggle;
    const passwordInput = document.getElementById(inputId);

    if (!passwordInput) return;

    const showPassword = passwordInput.type === "password";

    passwordInput.type = showPassword ? "text" : "password";

    button.textContent = showPassword ? "Hide" : "Show";

    button.setAttribute("aria-pressed", String(showPassword));

    button.setAttribute(
      "aria-label",
      showPassword ? "Hide password" : "Show password"
    );
  });
});


/* ==========================================
   EDUSAAS STUDENT DASHBOARD
   Frontend Demo
========================================== */

document.addEventListener("DOMContentLoaded", () => {
  eduLayoutReady.then(() => {
    // Run only on student dashboard pages

    if (!document.body.classList.contains("student-dashboard")) {
      return;
    }

    if (document.body.dataset.layoutInitialized === "true") return;
    document.body.dataset.layoutInitialized = "true";

    /* DATA */

    const data = {
      courses: [
        {
          id: "neural-networks",
          title: "Neural Networks",
          category: "Artificial Intelligence",
          description:
            "Explore neural networks, deep learning and intelligent models.",
          image:
            "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=80",
          progress: 68,
          lessons: "8 of 12 lessons"
        },
        {
          id: "operating-systems",
          title: "Operating Systems",
          category: "Computer Science",
          description:
            "Understand processes, memory management and modern operating systems.",
          image:
            "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
          progress: 42,
          lessons: "5 of 12 lessons"
        },
        {
          id: "data-structures",
          title: "Data Structures",
          category: "Programming",
          description:
            "Master arrays, linked lists, stacks, queues, trees and graphs.",
          image:
            "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80",
          progress: 85,
          lessons: "11 of 13 lessons"
        }
      ],

      plan: [
        {
          title: "Watch Lesson 9",
          subtitle: "Neural Networks",
          time: "30 min",
          icon: "play-circle",
          tone: "sd-blue"
        },
        {
          title: "Take Quick Quiz",
          subtitle: "Operating Systems",
          time: "15 min",
          icon: "clipboard-check",
          tone: "sd-rose"
        },
        {
          title: "Review Summary",
          subtitle: "Data Structures",
          time: "10 min",
          icon: "book-open-check",
          tone: "sd-mint"
        }
      ],

      assessments: [
        {
          title: "Neural Networks Quiz",
          course: "Neural Networks",
          detail: "Score: 92%",
          status: "Completed"
        },
        {
          title: "OS Fundamentals Quiz",
          course: "Operating Systems",
          detail: "Not started",
          status: "Upcoming"
        },
        {
          title: "Data Structures Test",
          course: "Data Structures",
          detail: "Score: 88%",
          status: "Completed"
        }
      ],

      notifications: [
        {
          title: "New lesson available",
          detail: "A new Neural Networks lesson is ready.",
          time: "Today",
          icon: "book-open",
          read: false
        },
        {
          title: "Assessment reminder",
          detail: "Your Operating Systems quiz is coming up.",
          time: "Yesterday",
          icon: "clipboard-check",
          read: false
        },
        {
          title: "Great progress!",
          detail: "You reached 85% in Data Structures.",
          time: "2 days ago",
          icon: "award",
          read: true
        }
      ]
    };

    /* HELPERS */

    const $ = selector => document.querySelector(selector);

    function make(tag, className = "", text = "") {
      const element = document.createElement(tag);

      element.className = className;
      element.textContent = text;

      return element;
    }

    function makeIcon(name) {
      const element = document.createElement("i");

      element.setAttribute("data-lucide", name);

      return element;
    }

    function refreshIcons() {
      if (window.lucide?.createIcons) {
        window.lucide.createIcons();
      }
    }

    function setText(selector, value) {
      const element = $(selector);

      if (element) {
        element.textContent = value;
      }
    }

    function makeImage(course) {
      const image = document.createElement("img");

      image.src = course.image;
      image.alt = course.title;
      image.loading = "lazy";

      return image;
    }

    function progressMeta(label, value) {
      const wrapper = make("div", "sd-progress-meta");

      wrapper.append(
        make("span", "", label),
        make("strong", "", `${value}%`)
      );

      return wrapper;
    }

    function progressBar(value) {
      const track = make("div", "sd-progress-track");
      const fill = make("span", "sd-progress-fill");

      fill.style.width = `${value}%`;

      track.append(fill);

      return track;
    }

    /* ENROLLED COURSES */

    function renderCourses(search = "") {

      const grid = $("#sdCourseGrid");

      if (!grid) return;

      grid.replaceChildren();

      const filteredCourses = data.courses.filter(course =>
        `${course.title} ${course.category}`
          .toLowerCase()
          .includes(search.toLowerCase().trim())
      );

      const empty = $("#sdSearchEmpty");

      if (empty) {
        empty.hidden = filteredCourses.length > 0;
      }

      filteredCourses.forEach(course => {

        const card = make("article", "sd-course-card");

        const art = make("div", "sd-course-art");

        art.append(makeImage(course));

        const body = make("div", "sd-course-body");

        const progress = make("div", "sd-course-progress");

        progress.append(
          progressMeta("Course Progress", course.progress),
          progressBar(course.progress)
        );

        const footer = make("div", "sd-course-footer");

        const lessons = make(
          "span",
          "sd-course-lessons",
          course.lessons
        );

        const button = make(
          "a",
          "sd-course-continue-btn",
          "Continue Learning"
        );

        // Demo link until lesson pages are created

        button.href = "StudentDashboard.html#progress";

        button.append(makeIcon("arrow-right"));

        footer.append(lessons, button);

        body.append(
          make("span", "sd-course-category", course.category),
          make("h3", "", course.title),
          make("p", "", course.description),
          progress,
          footer
        );

        card.append(art, body);

        grid.append(card);

      });

      setText(
        "#sdCourseCount",
        `${filteredCourses.length} courses`
      );

      refreshIcons();
    }

    /* CONTINUE LEARNING */

    function renderFeatured() {

      const container = $("#sdContinueCourse");

      if (!container) return;

      container.replaceChildren();

      const course = data.courses[0];

      if (!course) {
        container.textContent = "No enrolled courses yet.";
        return;
      }

      const wrapper = make("div", "sd-featured-course");

      const art = make("div", "sd-featured-art");

      art.append(makeImage(course));

      const details = make("div", "sd-featured-details");

      const button = make(
        "a",
        "sd-primary-btn",
        "Continue Learning"
      );

      button.href = "StudentDashboard.html#progress";

      button.append(makeIcon("arrow-right"));

      details.append(
        make("span", "sd-course-category", course.category),
        make("h3", "", course.title),
        make("p", "", course.lessons),
        progressMeta("Progress", course.progress),
        progressBar(course.progress),
        button
      );

      wrapper.append(art, details);

      container.append(wrapper);
    }

    /* TODAY'S PLAN */

    function renderPlan() {

      const container = $("#sdTodayPlan");

      if (!container) return;

      container.replaceChildren();

      data.plan.forEach(item => {

        const row = make("div", "sd-plan-item");

        const symbol = make(
          "span",
          `sd-mini-icon ${item.tone}`
        );

        symbol.append(makeIcon(item.icon));

        const copy = make("div", "sd-plan-copy");

        copy.append(
          make("strong", "", item.title),
          make("small", "", item.subtitle)
        );

        row.append(
          symbol,
          copy,
          make("span", "sd-plan-time", item.time)
        );

        container.append(row);

      });
    }

    /* PROGRESS */

    function renderProgress() {

      const courses = data.courses;

      const average = courses.length
        ? Math.round(
          courses.reduce(
            (sum, course) => sum + course.progress,
            0
          ) / courses.length
        )
        : 0;

      setText("#sdStatCourses", courses.length);

      setText("#sdStatProgress", `${average}%`);

      setText("#sdProgressRingText", `${average}%`);

      const ring = $("#sdProgressRing");

      if (ring) {

        ring.style.background =
          `conic-gradient(
          var(--color-mint) ${average}%,
          var(--color-background) ${average}%
        )`;

      }

      const container = $("#sdProgressBars");

      if (!container) return;

      container.replaceChildren();

      courses.forEach(course => {

        const item = make("div", "sd-progress-item");

        item.append(
          progressMeta(course.title, course.progress),
          progressBar(course.progress)
        );

        container.append(item);

      });
    }

    /* ASSESSMENTS */

    function renderAssessments() {

      const completed = data.assessments.filter(
        assessment => assessment.status === "Completed"
      ).length;

      setText("#sdStatAssessments", completed);

      const container = $("#sdAssessmentList");

      if (!container) return;

      container.replaceChildren();

      data.assessments.forEach(assessment => {

        const row = make("div", "sd-list-item");

        const symbol = make(
          "span",
          "sd-mini-icon sd-blue"
        );

        symbol.append(makeIcon("clipboard-check"));

        const copy = make("div", "sd-list-copy");

        copy.append(
          make("strong", "", assessment.title),
          make(
            "small",
            "",
            `${assessment.course} · ${assessment.detail}`
          )
        );

        const status = make(
          "span",
          "sd-status-pill" +
          (assessment.status === "Upcoming"
            ? " upcoming"
            : ""),
          assessment.status
        );

        row.append(symbol, copy, status);

        container.append(row);

      });
    }

    /* NOTIFICATIONS */

    function createNotification(notification) {

      const row = make(
        "div",
        "sd-list-item" +
        (!notification.read ? " unread" : "")
      );

      const symbol = make(
        "span",
        "sd-mini-icon sd-rose"
      );

      symbol.append(makeIcon(notification.icon));

      const copy = make("div", "sd-list-copy");

      copy.append(
        make("strong", "", notification.title),
        make("small", "", notification.detail),
        make(
          "span",
          "sd-notification-time",
          notification.time
        )
      );

      row.append(symbol, copy);

      if (!notification.read) {
        row.append(make("span", "sd-unread-mark"));
      }

      return row;
    }

    function renderNotifications() {

      const overview = $("#sdNotificationList");

      const dropdown = $("#sdDropdownNotificationList");

      // Home Overview

      if (overview) {

        overview.replaceChildren();

        data.notifications.slice(0, 3)
          .forEach(notification => {

            overview.append(
              createNotification(notification)
            );

          });
      }

      // Header Dropdown

      if (dropdown) {

        dropdown.replaceChildren();

        data.notifications.forEach(notification => {

          dropdown.append(
            createNotification(notification)
          );

        });
      }

      // Unread Counter

      const unread = data.notifications.filter(
        notification => !notification.read
      ).length;

      setText("#sdStatUnread", unread);

      setText("#sdNavUnread", unread);

      const navUnread = $("#sdNavUnread");

      const topDot = $("#sdTopDot");

      if (navUnread) {
        navUnread.hidden = unread === 0;
      }

      if (topDot) {
        topDot.hidden = unread === 0;
      }

      setText(
        "#sdDropdownUnread",
        unread === 0
          ? "You're all caught up!"
          : `${unread} unread notification${unread === 1 ? "" : "s"}`
      );

      refreshIcons();
    }

    /* MOBILE SIDEBAR */

    const sidebar = $("#sdSidebar");

    const backdrop = $("#sdBackdrop");

    const menuBtn = $("#sdMenuBtn");

    function setSidebar(open) {

      sidebar?.classList.toggle("open", open);

      backdrop?.classList.toggle("open", open);

      if (backdrop) {
        backdrop.hidden = !open;
      }

      menuBtn?.setAttribute(
        "aria-expanded",
        String(open)
      );
    }

    menuBtn?.addEventListener("click", () => {

      const isOpen = sidebar?.classList.contains("open");

      setSidebar(!isOpen);

    });

    backdrop?.addEventListener("click", () => {

      setSidebar(false);

    });

    /* NOTIFICATION DROPDOWN */

    const notificationDropdown =
      $("#sdNotificationDropdown");

    const notificationBtn =
      $("#sdNotificationBtn");

    const sidebarNotificationBtn =
      $("#sdSidebarNotificationBtn");

    const viewNotificationsBtn =
      $("#sdViewNotifications");

    function setNotifications(open) {

      if (!notificationDropdown) return;

      notificationDropdown.hidden = !open;

      notificationBtn?.setAttribute(
        "aria-expanded",
        String(open)
      );

      sidebarNotificationBtn?.setAttribute(
        "aria-expanded",
        String(open)
      );
    }

    function toggleNotifications() {

      if (!notificationDropdown) return;

      const shouldOpen = notificationDropdown.hidden;

      if (shouldOpen) {
        setSidebar(false);
      }

      setNotifications(shouldOpen);
    }

    // Header Bell

    if (
      notificationBtn &&
      notificationBtn.dataset.notificationInitialized !== "true"
    ) {
      notificationBtn.dataset.notificationInitialized = "true";
      notificationBtn.addEventListener(
        "click",
        toggleNotifications
      );
    }

    // Sidebar Notifications

    if (
      sidebarNotificationBtn &&
      sidebarNotificationBtn.dataset.notificationInitialized !== "true"
    ) {
      sidebarNotificationBtn.dataset.notificationInitialized = "true";
      sidebarNotificationBtn.addEventListener(
        "click",
        toggleNotifications
      );
    }

    // Home Overview - View All

    viewNotificationsBtn?.addEventListener(
      "click",
      () => {

        setSidebar(false);

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });

        setNotifications(true);

      }
    );

    // Close Button

    const closeNotificationsButton =
      $("#sdCloseNotifications");

    if (
      closeNotificationsButton &&
      closeNotificationsButton.dataset.notificationInitialized !== "true"
    ) {
      closeNotificationsButton.dataset.notificationInitialized = "true";
      closeNotificationsButton.addEventListener(
        "click",
        () => {

          setNotifications(false);

          notificationBtn?.focus();

        }
      );
    }

    // Close when clicking outside

    if (
      notificationDropdown &&
      notificationDropdown.dataset.outsideDismissInitialized !== "true"
    ) {
      notificationDropdown.dataset.outsideDismissInitialized = "true";

      document.addEventListener("click", event => {

        if (notificationDropdown.hidden) return;

        const clickedInside =
          notificationDropdown.contains(event.target);

        const clickedBell =
          notificationBtn?.contains(event.target);

        const clickedSidebar =
          sidebarNotificationBtn?.contains(event.target);

        const clickedViewAll =
          viewNotificationsBtn?.contains(event.target);

        if (
          !clickedInside &&
          !clickedBell &&
          !clickedSidebar &&
          !clickedViewAll
        ) {

          setNotifications(false);

        }
      });
    }

    // Escape Key

    if (
      notificationDropdown &&
      notificationDropdown.dataset.escapeDismissInitialized !== "true"
    ) {
      notificationDropdown.dataset.escapeDismissInitialized = "true";

      document.addEventListener("keydown", event => {

        if (event.key !== "Escape") return;

        if (!notificationDropdown.hidden) {

          setNotifications(false);

          notificationBtn?.focus();

        }

        setSidebar(false);

      });
    }

    /* MARK ALL AS READ */

    const markReadButton = $("#sdDropdownMarkRead");

    if (
      markReadButton &&
      markReadButton.dataset.notificationInitialized !== "true"
    ) {
      markReadButton.dataset.notificationInitialized = "true";
      markReadButton.addEventListener(
        "click",
        () => {

          data.notifications.forEach(notification => {
            notification.read = true;
          });

          renderNotifications();

        }
      );
    }

    /* SEARCH */

    $("#sdSearchInput")?.addEventListener(
      "input",
      event => {

        renderCourses(event.target.value);

      }
    );

    /* ==========================================
       ACTIVE SIDEBAR PAGE
    ========================================== */

    function updateActiveSidebar() {

      const currentPage = decodeURIComponent(
        window.location.pathname
      ).split("/").pop().toLowerCase();

      const currentHash = window.location.hash;

      const links = Array.from(
        document.querySelectorAll(
          ".sd-side-nav .sd-side-link"
        )
      );

      let activeLink = null;

      // Find the current page
      links.forEach(link => {

        if (link.tagName !== "A") return;

        const url = new URL(link.href);

        const linkPage = decodeURIComponent(
          url.pathname
        ).split("/").pop().toLowerCase();

        if (linkPage !== currentPage) return;

        if (currentPage === "studentdashboard.html") {

          const targetHash =
            currentHash === "#progress"
              ? "#progress"
              : "#home";

          if (url.hash === targetHash) {
            activeLink = link;
          }

        } else if (!url.hash || url.hash === currentHash) {

          activeLink = link;

        }

      });

      // Keep the HTML active state if no URL matches
      if (!activeLink) {
        activeLink = links.find(link =>
          link.tagName === "A" &&
          link.classList.contains("active")
        );
      }

      // Only one active link
      links.forEach(link => {

        const isActive = link === activeLink;

        link.classList.toggle("active", isActive);

        if (isActive) {
          link.setAttribute("aria-current", "page");
        } else {
          link.removeAttribute("aria-current");
        }

      });

    }

    updateActiveSidebar();

    window.addEventListener(
      "hashchange",
      updateActiveSidebar
    );

    window.addEventListener(
      "pageshow",
      updateActiveSidebar
    );


    /* SIDEBAR NAVIGATION */

    document.querySelectorAll(
      ".sd-side-nav a.sd-side-link"
    ).forEach(link => {

      link.addEventListener("click", () => {

        setSidebar(false);

        setNotifications(false);

      });

    });


    /* STUDENT PROFILE */

    const studentName = "Student";

    const initials = studentName === "Student"
      ? "ST"
      : studentName
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part.charAt(0).toUpperCase())
        .join("");

    document.querySelectorAll(
      "[data-sd-name]"
    ).forEach(element => {

      element.textContent = studentName;

    });

    document.querySelectorAll(
      "[data-sd-avatar]"
    ).forEach(element => {

      element.textContent = initials;

    });

    setText(
      "#sdFirstName",
      studentName.split(/\s+/)[0]
    );

    /* CURRENT DATE */

    setText(
      "#sdTodayDate",
      new Intl.DateTimeFormat("en", {
        weekday: "short",
        month: "short",
        day: "numeric"
      }).format(new Date())
    );

    /* LOG OUT */

    $("#sdLogoutBtn")?.addEventListener(
      "click",
      () => {

        const confirmed = window.confirm(
          "Are you sure you want to log out?"
        );

        if (!confirmed) return;

        window.alert(
          "Demo mode: connect Log Out to your authentication system."
        );

      }
    );



    /* ==========================================
       EDUSAAS - RAG AI ASSISTANT
       SINGLE PAGE
    ========================================== */

    function initRagAssistant() {

      /* PAGE ELEMENTS */

      const coursesView = $("#ragCoursesView");

      const chatView = $("#ragChatView");

      const grid = $("#ragCourseGrid");

      if (!coursesView || !chatView || !grid) return;


      /* CHAT ELEMENTS */

      const searchInput = $("#ragSearchInput");

      const searchWrapper = $("#ragSearchWrapper");

      const topbarTitle = $("#ragTopbarTitle");

      const sidebarLink = $("#ragSidebarLink");

      const backBtn = $("#ragBackBtn");

      const newChatBtn = $("#ragNewChatBtn");

      const courseTitle = $("#ragChatCourseTitle");

      const courseId = $("#ragChatCourseId");

      const form = $("#ragChatForm");

      const messages = $("#ragChatMessages");

      const welcome = $("#ragChatWelcome");

      const messageInput = $("#ragMessageInput");

      const uploadBtn = $("#ragUploadBtn");

      const imageInput = $("#ragImageInput");

      const imagePreview = $("#ragImagePreview");

      const previewImage = $("#ragPreviewImage");

      const imageName = $("#ragImageName");

      const removeImageBtn = $("#ragRemoveImage");

      const sendBtn = $("#ragSendBtn");

      const errorMessage = $("#ragChatError");


      /* RAG STATE */

      let selectedCourse = null;

      let selectedImage = null;

      let imageData = null;

      let imageLoading = false;

      let imageVersion = 0;

      let lastCourseButton = null;

      let coursesScrollPosition = 0;


      /* SEPARATE CHAT FOR EACH COURSE */

      const conversations = new Map();


      /* ==========================================
         RENDER ENROLLED COURSES
      ========================================== */

      function renderRagCourses(search = "") {

        grid.replaceChildren();

        const enrolledCourses = data.courses;

        const filteredCourses = enrolledCourses.filter(course =>

          `${course.title} ${course.category}`
            .toLowerCase()
            .includes(search.toLowerCase().trim())

        );

        setText(
          "#ragCourseCount",
          `${filteredCourses.length} courses`
        );

        const empty = $("#ragSearchEmpty");

        if (empty) {

          empty.hidden = filteredCourses.length > 0;

          empty.textContent = enrolledCourses.length === 0

            ? "You have no enrolled courses yet."

            : "No courses match your search.";

        }

        filteredCourses.forEach(course => {

          /* COURSE CARD */

          const card = make(
            "article",
            "rag-course-card"
          );


          /* COURSE IMAGE */

          const art = make(
            "div",
            "rag-course-image"
          );

          art.append(
            makeImage(course)
          );


          /* COURSE CONTENT */

          const body = make(
            "div",
            "rag-course-body"
          );

          const category = make(
            "span",
            "rag-course-category",
            course.category
          );

          const title = make(
            "h3",
            "",
            course.title
          );

          const description = make(
            "p",
            "",
            course.description
          );


          /* START CHAT BUTTON */

          const chatButton = make(
            "button",
            "rag-start-btn"
          );

          chatButton.type = "button";

          chatButton.setAttribute(
            "aria-label",
            `Start chat for ${course.title}`
          );

          chatButton.append(
            makeIcon("message-circle"),
            make("span", "", "Start Chat"),
            makeIcon("arrow-right")
          );


          /* OPEN CHAT IN SAME PAGE */

          chatButton.addEventListener(
            "click",
            () => {

              lastCourseButton = chatButton;

              openChat(course);

            }
          );


          /* APPEND CARD CONTENT */

          body.append(
            category,
            title,
            description,
            chatButton
          );

          card.append(
            art,
            body
          );

          grid.append(card);

        });

        refreshIcons();

      }


      /* ==========================================
         SIDEBAR ACTIVE STATE
      ========================================== */
      function keepAssistantActive() {
        updateActiveSidebar();
      }


      /* ==========================================
         OPEN CHAT
      ========================================== */

      function openChat(course) {

        if (!course) return;

        coursesScrollPosition = window.scrollY;

        selectedCourse = course;


        /* UPDATE COURSE HEADER */

        courseTitle.textContent =
          selectedCourse.title;

        courseId.textContent =
          `Course ID: ${selectedCourse.id}`;


        /* UPDATE PAGE TITLE */

        document.title =
          `${selectedCourse.title} | AI Assistant | EduSaaS`;


        /* SWITCH VIEWS */

        coursesView.hidden = true;

        chatView.hidden = false;


        /* SWITCH TOPBAR CONTENT */

        if (searchWrapper) {

          searchWrapper.hidden = true;

        }

        if (topbarTitle) {

          topbarTitle.hidden = false;

        }


        /* RESET COMPOSER */

        messageInput.value = "";

        clearImage();

        clearError();

        resizeTextarea();


        /* LOAD COURSE CONVERSATION */

        renderConversation();


        /* KEEP SIDEBAR ACTIVE */

        keepAssistantActive();


        /* CLOSE MOBILE SIDEBAR */

        setSidebar(false);

        setNotifications(false);


        /* SCROLL TO TOP */

        window.scrollTo({
          top: 0,
          behavior: "instant"
        });

        courseTitle.focus({
          preventScroll: true
        });

        refreshIcons();

        updateSendButton();

      }


      /* ==========================================
         BACK TO COURSES
      ========================================== */

      function showCourses() {

        const wasChatOpen = !chatView.hidden;


        /* SWITCH VIEWS */

        chatView.hidden = true;

        coursesView.hidden = false;


        /* RESTORE SEARCH */

        if (searchWrapper) {

          searchWrapper.hidden = false;

        }

        if (topbarTitle) {

          topbarTitle.hidden = true;

        }


        /* RESET CURRENT COURSE */

        selectedCourse = null;

        messageInput.value = "";

        clearImage();

        clearError();


        /* RESET PAGE TITLE */

        document.title =
          "AI Assistant | EduSaaS";


        /* KEEP SIDEBAR ACTIVE */

        keepAssistantActive();

        setSidebar(false);

        setNotifications(false);

        refreshIcons();


        /* RESTORE COURSE POSITION */

        if (wasChatOpen) {

          window.scrollTo({
            top: coursesScrollPosition,
            behavior: "instant"
          });

          lastCourseButton?.focus({
            preventScroll: true
          });

        }

      }


      /* BACK BUTTON */

      backBtn.addEventListener(
        "click",
        showCourses
      );


      /* AI ASSISTANT SIDEBAR LINK */

      sidebarLink?.addEventListener("click", event => {

        const currentPage =
          window.location.pathname.split("/").pop();

        if (currentPage !== "aitutor.html") return;

        event.preventDefault();

        showCourses();

      });


      /* ==========================================
         SEARCH COURSES
      ========================================== */

      searchInput?.addEventListener(
        "input",
        event => {

          renderRagCourses(
            event.target.value
          );

        }
      );


      /* ==========================================
         CHAT ERROR
      ========================================== */

      function showError(text) {

        if (!errorMessage) return;

        errorMessage.textContent = text;

        errorMessage.hidden = false;

      }


      function clearError() {

        if (!errorMessage) return;

        errorMessage.textContent = "";

        errorMessage.hidden = true;

      }


      /* ==========================================
         SEND BUTTON STATE
      ========================================== */

      function updateSendButton() {

        const hasText =
          messageInput.value.trim().length > 0;

        const hasImage =
          Boolean(selectedImage && imageData);

        sendBtn.disabled =

          !selectedCourse ||

          imageLoading ||

          (!hasText && !hasImage);

      }


      /* ==========================================
         AUTO RESIZE TEXTAREA
      ========================================== */

      function resizeTextarea() {

        messageInput.style.height = "auto";

        messageInput.style.height =

          `${Math.min(messageInput.scrollHeight, 140)}px`;

      }


      messageInput.addEventListener(
        "input",
        () => {

          resizeTextarea();

          updateSendButton();

        }
      );


      /* ==========================================
         SCROLL CHAT
      ========================================== */

      function scrollToBottom() {

        messages.scrollTop =
          messages.scrollHeight;

      }


      /* ==========================================
         IMAGE UPLOAD
      ========================================== */

      uploadBtn.addEventListener(
        "click",
        () => {

          imageInput.click();

        }
      );


      /* CLEAR SELECTED IMAGE */

      function clearImage() {

        imageVersion++;

        selectedImage = null;

        imageData = null;

        imageLoading = false;

        imageInput.value = "";

        previewImage.removeAttribute("src");

        imageName.textContent = "";

        imagePreview.hidden = true;

        updateSendButton();

      }


      /* SELECT IMAGE */

      imageInput.addEventListener(
        "change",
        () => {

          const file = imageInput.files[0];

          if (!file || !selectedCourse) return;

          clearError();

          const allowedTypes = [

            "image/jpeg",

            "image/png",

            "image/webp"

          ];


          /* VALIDATE FILE TYPE */

          if (!allowedTypes.includes(file.type)) {

            clearImage();

            showError(
              "Please select a JPG, PNG or WEBP image."
            );

            return;

          }


          /* VALIDATE FILE SIZE */

          if (file.size > 10 * 1024 * 1024) {

            clearImage();

            showError(
              "Image size must not exceed 10 MB."
            );

            return;

          }


          /* IMAGE STATE */

          const version = ++imageVersion;

          selectedImage = file;

          imageData = null;

          imageLoading = true;

          imagePreview.hidden = true;

          updateSendButton();


          /* READ IMAGE */

          const reader = new FileReader();

          reader.onload = () => {

            if (version !== imageVersion) return;

            const imageCheck = new Image();

            imageCheck.onload = () => {

              if (version !== imageVersion) return;

              imageData = reader.result;

              previewImage.src = imageData;

              imageName.textContent = file.name;

              imagePreview.hidden = false;

              imageLoading = false;

              updateSendButton();

            };

            imageCheck.onerror = () => {

              if (version !== imageVersion) return;

              clearImage();

              showError(
                "This image could not be opened."
              );

            };

            imageCheck.src = reader.result;

          };


          reader.onerror = () => {

            if (version !== imageVersion) return;

            clearImage();

            showError(
              "Unable to open this image. Please try again."
            );

          };

          reader.readAsDataURL(file);

        }
      );


      /* REMOVE IMAGE */

      removeImageBtn.addEventListener(
        "click",
        () => {

          clearImage();

          clearError();

          messageInput.focus();

        }
      );


      /* ==========================================
         SUGGESTED QUESTIONS
      ========================================== */

      chatView.querySelectorAll(
        "[data-rag-prompt]"
      ).forEach(button => {

        button.addEventListener(
          "click",
          () => {

            messageInput.value =
              button.dataset.ragPrompt;

            resizeTextarea();

            updateSendButton();

            messageInput.focus();

          }
        );

      });


      /* ==========================================
         GET COURSE CONVERSATION
      ========================================== */

      function getConversation() {

        if (!selectedCourse) return [];

        if (!conversations.has(selectedCourse.id)) {

          conversations.set(
            selectedCourse.id,
            []
          );

        }

        return conversations.get(
          selectedCourse.id
        );

      }


      /* ==========================================
         CREATE MESSAGE ELEMENT
      ========================================== */

      function createMessageElement(message) {

        const row = make(
          "div",
          `rag-message-row ${message.role}`
        );


        /* ASSISTANT AVATAR */

        if (message.role === "assistant") {

          const avatar = make(
            "span",
            "rag-message-avatar"
          );

          avatar.append(
            makeIcon("bot")
          );

          row.append(avatar);

        }


        /* MESSAGE BUBBLE */

        const bubble = make(
          "div",
          "rag-message-bubble"
        );

        bubble.setAttribute(
          "aria-label",
          message.role === "user"
            ? "Your message"
            : "Assistant message"
        );


        /* MESSAGE IMAGE */

        if (message.image) {

          const image = document.createElement("img");

          image.alt = "Uploaded course question";

          image.addEventListener(
            "load",
            scrollToBottom
          );

          image.src = message.image;

          bubble.append(image);

        }


        /* MESSAGE TEXT */

        if (message.text) {

          const paragraph = make(
            "p",
            "",
            message.text
          );

          bubble.append(paragraph);

        }


        /* MESSAGE TIME */

        const time = make(
          "span",
          "rag-message-time",
          message.time
        );

        bubble.append(time);

        row.append(bubble);

        return row;

      }


      /* ==========================================
         ADD MESSAGE
      ========================================== */

      function addMessage(role, text, image = null) {

        if (!selectedCourse) return;

        const message = {

          role,

          text,

          image,

          time: new Intl.DateTimeFormat(
            "en",
            {
              hour: "numeric",
              minute: "2-digit"
            }
          ).format(new Date())

        };


        /* SAVE IN CURRENT COURSE CHAT */

        getConversation().push(message);


        /* HIDE WELCOME SCREEN */

        welcome.hidden = true;


        /* DISPLAY MESSAGE */

        messages.append(
          createMessageElement(message)
        );

        refreshIcons();

        scrollToBottom();

      }


      /* ==========================================
         RENDER COURSE CONVERSATION
      ========================================== */

      function renderConversation() {

        messages.querySelectorAll(
          ".rag-message-row"
        ).forEach(message => {

          message.remove();

        });

        const conversation = getConversation();

        welcome.hidden =
          conversation.length > 0;

        conversation.forEach(message => {

          messages.append(
            createMessageElement(message)
          );

        });

        refreshIcons();

        scrollToBottom();

      }


      /* ==========================================
         DEMO ASSISTANT MESSAGE
      ========================================== */

      function getDemoReply(hasImage) {

        if (hasImage) {

          return "Your image has been added to the conversation. This is a preview of the image chat experience.";

        }

        return `Welcome to your ${selectedCourse.title} learning space! Your message has been added to this demo conversation.`;

      }


      /* ==========================================
         SEND MESSAGE
      ========================================== */

      form.addEventListener(
        "submit",
        event => {

          event.preventDefault();

          if (!selectedCourse || imageLoading) return;

          const text =
            messageInput.value.trim();

          const image = imageData;

          if (!text && !image) return;

          clearError();


          /* USER MESSAGE */

          addMessage(
            "user",
            text,
            image
          );


          /* RESET INPUT */

          messageInput.value = "";

          clearImage();

          resizeTextarea();

          updateSendButton();


          /* ASSISTANT DEMO MESSAGE */

          addMessage(
            "assistant",
            getDemoReply(Boolean(image))
          );

          messageInput.focus();

        }
      );


      /* ==========================================
         ENTER TO SEND
      ========================================== */

      messageInput.addEventListener(
        "keydown",
        event => {

          if (

            event.key === "Enter" &&

            !event.shiftKey &&

            !event.isComposing

          ) {

            event.preventDefault();

            if (!sendBtn.disabled) {

              form.requestSubmit();

            }

          }

        }
      );


      /* ==========================================
         NEW CHAT
      ========================================== */

      newChatBtn.addEventListener(
        "click",
        () => {

          if (!selectedCourse) return;

          const conversation = getConversation();

          if (conversation.length > 0) {

            const confirmed = window.confirm(
              "Start a new conversation?"
            );

            if (!confirmed) return;

          }


          /* CLEAR CURRENT COURSE CONVERSATION */

          conversations.set(
            selectedCourse.id,
            []
          );


          /* RESET CHAT */

          messageInput.value = "";

          clearImage();

          clearError();

          resizeTextarea();

          renderConversation();

          updateSendButton();

          messageInput.focus();

        }
      );


      /* ==========================================
         INITIAL RAG STATE
      ========================================== */

      renderRagCourses();

      showCourses();

      updateSendButton();

      refreshIcons();

    }


    /* ==========================================
       INITIAL RENDER
    ========================================== */

    refreshIcons();

    renderFeatured();

    renderPlan();

    renderCourses();

    renderProgress();

    renderAssessments();

    renderNotifications();

    initRagAssistant();

    refreshIcons();

  }).catch((error) => {
    console.error("Unable to initialize the student dashboard layouts:", error);
  });
});
/* =========================================
   EduSaaS - Shared Email Verification Page
========================================= */

document.addEventListener("DOMContentLoaded", () => {

  if (!document.body.classList.contains(
    "verification-page"
  )) return;

  const title = document.getElementById(
    "emailConfirmationTitle"
  );

  const eyebrow = document.getElementById(
    "verificationEyebrow"
  );

  const description = document.getElementById(
    "verificationDescription"
  );

  const emailAddress = document.getElementById(
    "confirmationEmailAddress"
  );

  const feedback = document.getElementById(
    "confirmationFeedback"
  );

  const resendButton = document.getElementById(
    "resendConfirmationBtn"
  );

  const openEmailButton = document.getElementById(
    "openEmailAppBtn"
  );

  let verificationData;
  let account;

  try {

    verificationData = JSON.parse(
      sessionStorage.getItem(
        "edusaas.verification"
      ) || "null"
    );

    if (verificationData?.email) {

      account = eduVerification.getAccount(
        verificationData.email
      );

    }

  } catch (error) {

    window.location.replace("Login.html");
    return;

  }

  if (
    !verificationData?.email ||
    !account ||
    account.emailVerified === true
  ) {

    window.location.replace("Login.html");
    return;

  }

  const email = verificationData.email;

  emailAddress.textContent = email;

  /* Coming from Login */

  if (verificationData.source === "login") {

    eyebrow.textContent = "ACCOUNT ACTIVATION";

    title.textContent = "Email not verified";

    description.textContent =
      "Your account has not been activated yet. Please verify your email address before logging in.";

  } else {

    /* Coming from Signup */

    eyebrow.textContent = "ONE LAST STEP";

    title.textContent = "Check your inbox!";

    description.textContent =
      "Your account has been created. Please verify your email address to activate your account.";

  }

  /* Email Provider */

  const domain = email.split("@")[1];

  let emailUrl = "https://mail.google.com/";

  if (
    ["outlook.com", "hotmail.com", "live.com"]
      .includes(domain)
  ) {

    emailUrl = "https://outlook.live.com/mail/";

  } else if (
    ["yahoo.com", "yahoo.co.uk"]
      .includes(domain)
  ) {

    emailUrl = "https://mail.yahoo.com/";

  } else if (
    ["icloud.com", "me.com", "mac.com"]
      .includes(domain)
  ) {

    emailUrl = "https://www.icloud.com/mail/";

  }

  openEmailButton.href = emailUrl;

  /* Demo Feedback */

  feedback.textContent =
    "Demo mode: Email verification is not connected yet. No email has been sent.";

  /* Resend Confirmation */

  resendButton.addEventListener("click", () => {

    feedback.textContent =
      "Resending is not connected yet. No email has been sent.";

  });

});

(() => {
  "use strict";

  const mathLiveVersion = "0.111.4";
  const mathLiveScript = `https://unpkg.com/mathlive@${mathLiveVersion}/mathlive.min.js`;
  const mathLiveStyles = `https://unpkg.com/mathlive@${mathLiveVersion}/mathlive-static.css`;
  let mathLivePromise;
  let mathLiveStylePromise;
  let mathDialog;
  let mathBackdrop;
  let mathField;
  let fallbackInput;
  let mathStatus;
  let removeEquationButton;
  let activeTarget;
  let activeRange;
  let keyboardGeometryInitialized = false;
  let mathInitializationSettled = false;
  let mathInitializationError = null;
  const savedSelections = new WeakMap();

  function loadMathLive() {
    if (mathLivePromise) return mathLivePromise;
    mathLivePromise = Promise.all([
      loadMathLiveStyles(),
      new Promise((resolve, reject) => {
        if (customElements.get("math-field")) {
          resolve();
          return;
        }
        const existingScript = document.querySelector(`script[src="${mathLiveScript}"]`);
        if (existingScript) {
          existingScript.addEventListener("load", resolve, { once: true });
          existingScript.addEventListener("error", () => reject(new Error("MathLive could not be loaded.")), { once: true });
          return;
        }
        const script = document.createElement("script");
        script.src = mathLiveScript;
        script.async = true;
        script.onload = resolve;
        script.onerror = () => {
          script.remove();
          reject(new Error("MathLive could not be loaded."));
        };
        document.head.append(script);
      })
    ]).then(() => customElements.whenDefined("math-field")).catch((error) => {
      mathLivePromise = null;
      throw error;
    });
    return mathLivePromise;
  }

  function loadMathLiveStyles() {
    if (mathLiveStylePromise) return mathLiveStylePromise;
    const existing = document.querySelector(`link[href="${mathLiveStyles}"]`);
    if (existing?.sheet) {
      mathLiveStylePromise = Promise.resolve();
      return mathLiveStylePromise;
    }
    mathLiveStylePromise = new Promise((resolve, reject) => {
      const stylesheet = existing || document.createElement("link");
      stylesheet.rel = "stylesheet";
      stylesheet.href = mathLiveStyles;
      stylesheet.addEventListener("load", resolve, { once: true });
      stylesheet.addEventListener("error", () => reject(new Error("MathLive styles could not be loaded.")), { once: true });
      if (!existing) document.head.append(stylesheet);
    }).catch((error) => {
      mathLiveStylePromise = null;
      throw error;
    });
    return mathLiveStylePromise;
  }

  function closeMathEditor() {
    hideMathMenu();
    window.mathVirtualKeyboard?.hide();
    mathDialog?.close();
  }

  function getOpenMathMenu() {
    const menu = mathField?.shadowRoot?.querySelector('[part~="ui-menu-container"]');
    return menu?.matches(":popover-open") ? menu : null;
  }

  function hideMathMenu() {
    if (!getOpenMathMenu()) return;
    const menuController = mathField?._mathfield?._menu;
    if (typeof menuController?.hide !== "function") {
      throw new Error("MathLive's menu controller is unavailable.");
    }
    // The pinned MathLive controller owns popover and shared-scrim cleanup.
    menuController.hide();
  }

  function getActionAtPoint(x, y) {
    return [...(mathDialog?.querySelectorAll(".edu-math-actions button:not([hidden])") || [])]
      .find((button) => {
        const rect = button.getBoundingClientRect();
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
      });
  }

  function getMathFieldControlAtPoint(x, y) {
    return [...(mathField?.shadowRoot?.querySelectorAll('[part~="menu-toggle"], [part~="virtual-keyboard-toggle"]') || [])]
      .find((control) => {
        const rect = control.getBoundingClientRect();
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
      });
  }

  function dismissMathMenuForAction(event) {
    if (!mathDialog?.open) return;
    const control = getMathFieldControlAtPoint(event.clientX, event.clientY);
    if (
      window.mathVirtualKeyboard?.visible &&
      control?.getAttribute("part")?.includes("menu-toggle")
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      window.mathVirtualKeyboard.hide();
      mathField.focus();
      mathField.showMenu();
      return;
    }
    const menu = getOpenMathMenu();
    if (!menu || !event.composedPath().includes(mathField)) return;
    const clickedMenuItem = event.composedPath().some(
      (target) => target instanceof Element && target.getAttribute("role")?.startsWith("menuitem")
    );
    if (clickedMenuItem) return;
    const action = getActionAtPoint(event.clientX, event.clientY);
    event.preventDefault();
    event.stopImmediatePropagation();
    hideMathMenu();
    if (control?.getAttribute("part")?.includes("virtual-keyboard-toggle")) {
      mathField.focus();
      if (window.mathVirtualKeyboard.visible) window.mathVirtualKeyboard.hide();
      else window.mathVirtualKeyboard.show();
    } else if (control) {
      mathField.focus();
    } else if (action) {
      action.click();
    } else if (!control) {
      const dialogRect = mathDialog.getBoundingClientRect();
      if (
        event.clientX < dialogRect.left ||
        event.clientX > dialogRect.right ||
        event.clientY < dialogRect.top ||
        event.clientY > dialogRect.bottom
      ) {
        closeMathEditor();
      } else {
        mathField.focus();
      }
    }
  }

  function updateKeyboardGeometry() {
    if (!window.mathVirtualKeyboard) return;
    const height = window.mathVirtualKeyboard.visible
      ? window.mathVirtualKeyboard.boundingRect.height
      : 0;
    document.documentElement.style.setProperty("--edu-math-keyboard-height", `${height}px`);
  }

  function getDialog() {
    if (mathDialog) return mathDialog;
    mathBackdrop = document.createElement("div");
    mathBackdrop.className = "edu-math-backdrop";
    mathBackdrop.hidden = true;
    mathBackdrop.setAttribute("aria-hidden", "true");
    mathBackdrop.addEventListener("click", closeMathEditor);
    mathDialog = document.createElement("dialog");
    mathDialog.className = "edu-math-editor";
    mathDialog.setAttribute("aria-labelledby", "eduMathEditorTitle");
    mathDialog.setAttribute("aria-modal", "true");
    const heading = document.createElement("h2");
    heading.id = "eduMathEditorTitle";
    heading.textContent = "Insert mathematical equation";
    const description = document.createElement("p");
    description.textContent = "Use the math keyboard to write an equation. This tool does not calculate or solve it.";
    mathField = document.createElement("math-field");
    mathField.className = "edu-math-editor-field";
    mathField.setAttribute("virtual-keyboard-mode", "onfocus");
    mathField.setAttribute("aria-label", "Mathematical equation");
    fallbackInput = document.createElement("textarea");
    fallbackInput.className = "form-control edu-math-fallback";
    fallbackInput.setAttribute("aria-label", "Equation LaTeX source");
    fallbackInput.placeholder = "Enter equation in LaTeX, for example: \\frac{a}{b}";
    fallbackInput.hidden = true;
    mathStatus = document.createElement("p");
    mathStatus.className = "edu-math-status";
    mathStatus.setAttribute("role", "status");
    const actions = document.createElement("div");
    actions.className = "edu-math-actions";
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "btn btn-secondary";
    cancel.textContent = "Cancel";
    cancel.addEventListener("click", closeMathEditor);
    removeEquationButton = document.createElement("button");
    removeEquationButton.type = "button";
    removeEquationButton.className = "btn btn-secondary";
    removeEquationButton.textContent = "Remove equation";
    removeEquationButton.hidden = true;
    removeEquationButton.addEventListener("click", deleteActiveEquation);
    const insert = document.createElement("button");
    insert.type = "button";
    insert.className = "btn btn-primary";
    insert.textContent = "Insert equation";
    insert.addEventListener("click", insertEquation);
    actions.append(removeEquationButton, cancel, insert);
    mathDialog.append(heading, description, mathField, fallbackInput, mathStatus, actions);
    mathField.setAttribute("virtual-keyboard-mode", "manual");
    mathDialog.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMathEditor();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [...mathDialog.querySelectorAll("button:not([disabled]), textarea:not([hidden]), math-field:not([hidden])")];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    mathDialog.addEventListener("close", () => {
      window.mathVirtualKeyboard?.hide();
      mathBackdrop.hidden = true;
      activeTarget?.focus();
    });
    document.addEventListener("pointerdown", dismissMathMenuForAction, true);
    document.body.append(mathBackdrop, mathDialog);
    return mathDialog;
  }

  function getMathAtomLatex(atom) {
    return atom.dataset.latex || atom.value || atom.textContent || "";
  }

  function createMathAtom(latex) {
    const atom = document.createElement(customElements.get("math-field") ? "math-field" : "span");
    atom.className = customElements.get("math-field") ? "edu-math-inline" : "edu-math-inline-fallback";
    atom.dataset.eduMathAtom = "true";
    atom.dataset.latex = latex;
    atom.setAttribute("contenteditable", "false");
    atom.tabIndex = 0;
    atom.setAttribute("aria-label", "Mathematical expression");
    if (atom.localName === "math-field") {
      atom.setAttribute("read-only", "");
      atom.setAttribute("virtual-keyboard-mode", "off");
      atom.value = latex;
    } else {
      atom.textContent = "Mathematical expression";
      atom.title = "Mathematical expression";
    }
    return atom;
  }

  function upgradeMathAtoms() {
    if (!customElements.get("math-field")) return;
    document.querySelectorAll(".edu-math-inline-fallback[data-edu-math-atom]").forEach((fallback) => {
      fallback.replaceWith(createMathAtom(getMathAtomLatex(fallback)));
    });
  }

  function initializeInlineMathFields() {
    document.querySelectorAll("math-field.edu-math-preview:not([data-math-initialized])").forEach((field) => {
      const latex = field.textContent || "";
      field.value = latex;
      field.replaceChildren();
      field.dataset.mathInitialized = "true";
    });
  }

  function appendTextWithBreaks(container, text) {
    String(text).replace(/\r\n?/g, "\n").split("\n").forEach((line, index) => {
      if (index) container.append(document.createElement("br"));
      if (line) container.append(document.createTextNode(line));
    });
  }

  function renderEditableField(field, value) {
    field.replaceChildren();
    const source = String(value ?? "");
    const pattern = /\\\(([\s\S]+?)\\\)/g;
    let offset = 0;
    let match;
    while ((match = pattern.exec(source))) {
      appendTextWithBreaks(field, source.slice(offset, match.index));
      field.append(createMathAtom(match[1]));
      offset = pattern.lastIndex;
    }
    appendTextWithBreaks(field, source.slice(offset));
  }

  function insertPlainTextAtSelection(field, text) {
    const selection = window.getSelection();
    if (!selection?.rangeCount || !field.contains(selection.anchorNode)) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const fragment = document.createDocumentFragment();
    appendTextWithBreaks(fragment, text);
    const lastNode = fragment.lastChild;
    range.insertNode(fragment);
    if (lastNode) range.setStartAfter(lastNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    field.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function serializeEditableField(field) {
    function serialize(node) {
      if (node.nodeType === Node.TEXT_NODE) return node.nodeValue || "";
      if (node.nodeType !== Node.ELEMENT_NODE) return "";
      if (node.matches("[data-edu-math-atom]")) return `\\(${getMathAtomLatex(node)}\\)`;
      if (node.tagName === "BR") return "\n";
      return [...node.childNodes].map(serialize).join("");
    }
    return [...field.childNodes].map(serialize).join("");
  }

  function createEditableField(value, attrs = {}) {
    const field = document.createElement("div");
    field.className = "form-control edu-math-rich-editor";
    field.contentEditable = "true";
    field.setAttribute("role", "textbox");
    field.setAttribute("spellcheck", "true");
    Object.entries(attrs).forEach(([name, attrValue]) => field.setAttribute(name, attrValue));
    renderEditableField(field, value);

    const captureSelection = () => {
      const selection = window.getSelection();
      if (selection?.rangeCount && field.contains(selection.anchorNode)) {
        savedSelections.set(field, selection.getRangeAt(0).cloneRange());
      }
    };
    field.addEventListener("mouseup", captureSelection);
    field.addEventListener("keyup", captureSelection);
    field.addEventListener("blur", captureSelection);
    field.addEventListener("pointerdown", (event) => {
      const atom = event.target.closest?.("[data-edu-math-atom]");
      if (atom && field.contains(atom)) event.preventDefault();
    }, true);
    field.addEventListener("click", (event) => {
      const atom = event.target.closest?.("[data-edu-math-atom]");
      if (atom && field.contains(atom)) openMathEditor(field, { atom, latex: getMathAtomLatex(atom) });
    }, true);
    field.addEventListener("keydown", (event) => {
      const atom = event.target.closest?.("[data-edu-math-atom]");
      if (atom && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        openMathEditor(field, { atom, latex: getMathAtomLatex(atom) });
        return;
      }
      if (event.key !== "Enter") return;
      event.preventDefault();
      const selection = window.getSelection();
      if (!selection?.rangeCount) return;
      const range = selection.getRangeAt(0);
      if (!field.contains(range.startContainer)) return;
      range.deleteContents();
      const lineBreak = document.createElement("br");
      range.insertNode(lineBreak);
      range.setStartAfter(lineBreak);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      field.dispatchEvent(new Event("input", { bubbles: true }));
    });
    field.addEventListener("paste", (event) => {
      event.preventDefault();
      const text = event.clipboardData?.getData("text/plain") || "";
      insertPlainTextAtSelection(field, text);
    });
    field.addEventListener("drop", (event) => {
      event.preventDefault();
      insertPlainTextAtSelection(field, event.dataTransfer?.getData("text/plain") || "");
    });
    return field;
  }

  function getInsertionRange(target) {
    const selection = window.getSelection();
    if (selection?.rangeCount && target.contains(selection.anchorNode)) {
      return selection.getRangeAt(0).cloneRange();
    }
    const saved = savedSelections.get(target);
    if (saved && target.contains(saved.startContainer)) return saved.cloneRange();
    const range = document.createRange();
    range.selectNodeContents(target);
    range.collapse(false);
    return range;
  }

  function openMathEditor(target, range) {
    activeTarget = target;
    activeRange = range;
    hideMathMenu();
    window.mathVirtualKeyboard?.hide();
    const dialog = getDialog();
    removeEquationButton.hidden = !range.atom;
    fallbackInput.hidden = true;
    mathField.hidden = false;
    mathStatus.textContent = "Preparing mathematical input…";
    if (!dialog.open) {
      mathBackdrop.hidden = false;
      dialog.show();
    }
    if (mathInitializationError) {
      mathField.hidden = true;
      fallbackInput.hidden = false;
      fallbackInput.value = range.latex || "";
      mathStatus.textContent = `${mathInitializationError.message} Enter LaTeX below or cancel to continue editing normally.`;
      fallbackInput.focus();
      return;
    }
    if (mathInitializationSettled) {
      document.body.style.setProperty("--keyboard-zindex", "10002");
      window.mathVirtualKeyboard.container = document.body;
      if (!keyboardGeometryInitialized) {
        window.mathVirtualKeyboard.addEventListener("geometrychange", updateKeyboardGeometry);
        keyboardGeometryInitialized = true;
      }
      mathField.setAttribute("virtual-keyboard-mode", "manual");
      mathField.value = range.latex || "";
      mathStatus.textContent = "Equation editor ready.";
      mathField.focus();
    }
  }

  function prepare() {
    getDialog();
    return loadMathLive().then(async () => {
      upgradeMathAtoms();
      initializeInlineMathFields();
      if (mathField.updateComplete) await mathField.updateComplete;
      return mathDialog;
    });
  }

  function settleInitialization(error = null) {
    mathInitializationError = error;
    mathInitializationSettled = true;
    document.querySelectorAll(".edu-math-trigger").forEach((button) => {
      button.disabled = false;
    });
  }

  function insertEquation() {
    if (!activeTarget || !activeRange) return;
    const latex = fallbackInput.hidden ? mathField.value : fallbackInput.value;
    if (!latex.trim()) {
      mathStatus.textContent = "Enter an equation before inserting.";
      return;
    }
    const atom = createMathAtom(latex);
    if (activeRange.atom?.isConnected) {
      activeRange.atom.replaceWith(atom);
    } else {
      const range = activeRange.range.cloneRange();
      range.deleteContents();
      range.insertNode(atom);
      range.setStartAfter(atom);
      range.collapse(true);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      savedSelections.set(activeTarget, range.cloneRange());
    }
    activeTarget.dispatchEvent(new Event("input", { bubbles: true }));
    closeMathEditor();
  }

  function deleteActiveEquation() {
    if (!activeRange?.atom?.isConnected) return;
    activeRange.atom.remove();
    activeTarget.dispatchEvent(new Event("input", { bubbles: true }));
    closeMathEditor();
  }

  function createButton(target, label) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "edu-math-trigger";
    button.disabled = !mathInitializationSettled;
    button.setAttribute("aria-label", `Insert a mathematical equation in ${label}`);
    button.title = "Insert mathematical equation";
    const mathIcon = document.createElement("i");
    mathIcon.setAttribute("data-lucide", "calculator");
    mathIcon.setAttribute("aria-hidden", "true");
    button.append(mathIcon);
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      savedSelections.set(target, getInsertionRange(target));
    });
    button.addEventListener("click", () => {
      openMathEditor(target, { range: getInsertionRange(target), latex: "" });
    });
    return button;
  }

  function renderInlineMath(container, value) {
    const text = String(value ?? "");
    const pattern = /\\\(([\s\S]+?)\\\)/g;
    let offset = 0;
    let match;
    while ((match = pattern.exec(text))) {
      if (match.index > offset) container.append(document.createTextNode(text.slice(offset, match.index)));
      const fallbackContent = match[1];
      const math = document.createElement("math-field");
      math.className = "edu-math-preview";
      math.setAttribute("read-only", "");
      math.setAttribute("virtual-keyboard-mode", "off");
      math.setAttribute("contenteditable", "false");
      if (customElements.get("math-field")) {
        math.value = fallbackContent;
        math.dataset.mathInitialized = "true";
      } else {
        math.textContent = fallbackContent;
      }
      container.append(math);
      offset = pattern.lastIndex;
      if (!customElements.get("math-field")) {
        void loadMathLive().then(initializeInlineMathFields).catch(() => {
          const fallback = document.createElement("span");
          fallback.className = "edu-math-preview-fallback";
          fallback.textContent = "Mathematical expression unavailable";
          math.replaceWith(fallback);
        });
      }
    }
    if (offset < text.length) container.append(document.createTextNode(text.slice(offset)));
  }

  window.eduMathInput = Object.freeze({
    load: loadMathLive,
    prepare,
    settleInitialization,
    createField: createEditableField,
    serializeField: serializeEditableField,
    createButton,
    renderInline: renderInlineMath
  });
})();

/* =========================================
   Teacher Assessment Workspace
========================================= */

document.addEventListener("DOMContentLoaded", () => {
  if (!document.body.classList.contains("assessment-page")) return;

  void window.eduMathInput.prepare().then(() => {
    window.eduMathInput.settleInitialization();
  }).catch((error) => {
    window.eduMathInput.settleInitialization(error);
    console.warn("MathLive could not be prepared; equation fields will remain editable as text.", error);
  });
  const ready = window.eduLayouts?.ready || Promise.resolve();
  ready.then(initTeacherAssessment).catch((error) => {
    console.error("Unable to initialize the teacher assessment page:", error);
    const feedback = document.getElementById("assessmentFeedback");
    if (feedback) feedback.textContent = "The shared layout could not be initialized. Refresh the page and try again.";
  });
});

function initTeacherAssessment() {
  if (document.body.dataset.assessmentInitialized === "true") return;
  document.body.dataset.assessmentInitialized = "true";

  const api = window.eduApi?.assessment;
  const $ = (selector, root = document) => root.querySelector(selector);
  const byId = (id) => document.getElementById(id);
  const el = (tag, attrs = {}, children = []) => {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (key === "text") node.textContent = value;
      else if (key === "className") node.className = value;
      else if (key === "value") node.value = value;
      else if (key === "checked" || key === "disabled" || key === "required" || key === "open") node[key] = value;
      else if (key.startsWith("on")) return;
      else node.setAttribute(key, String(value));
    });
    (Array.isArray(children) ? children : [children]).forEach((child) => {
      if (child instanceof Node) node.append(child);
      else if (child !== null && child !== undefined) node.append(document.createTextNode(String(child)));
    });
    return node;
  };
  const icon = (name) => {
    const item = el("i", { "data-lucide": name, "aria-hidden": "true" });
    return item;
  };
  const button = (label, action, iconName, className = "btn btn-secondary") =>
    el("button", { type: "button", className, "data-action": action },
      [icon(iconName), document.createTextNode(` ${label}`)]);
  const labelField = (label, control, hint) => {
    const isMathField = control.classList.contains("edu-math-input");

    const wrap = el(isMathField ? "div" : "label", {
      className: "as-field"
    });

    wrap.append(
      el("span", {
        className: "as-field-label",
        text: label
      }),
      control
    );

    if (hint) {
      wrap.append(
        el("small", {
          className: "as-field-hint",
          text: hint
        })
      );
    }

    return wrap;
  };
  const input = (label, value, attrs = {}) => labelField(label, el("input", {
    className: "form-control",
    value: value ?? "",
    ...attrs
  }));
  const select = (label, value, choices, attrs = {}) => {
    const control = el("select", { className: "form-control", ...attrs });
    choices.forEach(([optionValue, optionLabel]) => {
      const option = el("option", { value: optionValue, text: optionLabel });
      option.selected = String(value) === String(optionValue);
      control.append(option);
    });
    return labelField(label, control);
  };
  const textarea = (label, value, attrs = {}) => {
    const control = el("textarea", { className: "form-control", ...attrs });
    control.value = value ?? "";
    return labelField(label, control);
  };
  const refreshIcons = () => window.lucide?.createIcons?.();
  const localId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const setFeedback = (message = "", type = "info") => {
    const region = byId("assessmentFeedback");
    region.textContent = message;
    region.dataset.type = type;
  };
  const humanSize = (size) => {
    if (!size) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
    return `${(size / (1024 ** index)).toFixed(index ? 1 : 0)} ${units[index]}`;
  };
  const defaultAssessment = (method) => ({
    id: null,
    title: "",
    courseId: "",
    method,
    questionType: "mcq",
    questionCount: 5,
    mcqCount: 3,
    essayCount: 2,
    difficulty: "Medium",
    mcqMarks: 1,
    essayMarks: 5,
    marksPerQuestion: 1,
    duration_min: 60,
    pass_marks: 1,
    max_attempt: 1,
    shuffle_question: false,
    shuffle_option: false,
    start_date_time: "",
    instructions: "",
    pastedText: "",
    lectureIds: [],
    materials: [],
    questions: [],
    showRubricToStudents: false,
    status: "draft"
  });

  let courses = [];
  let lectures = [];
  let assessment = null;
  let originalFile = null;
  let builderVisible = false;
  let saving = false;
  let searchTerm = "";
  const expandedQuestions = new Set();
  const workspace = byId("assessmentWorkspace");
  const workspaceContent = byId("workspaceContent");
  const questionList = byId("assessmentQuestionList");
  const summary = byId("assessmentSummary");
  const savedList = byId("savedAssessmentList");
  const previewDialog = byId("assessmentPreview");
  const previewContent = byId("previewContent");

  function ensureEditable() {
    if (!assessment) return false;
    if (assessment.status === "published") {
      setFeedback("Published assessments are read-only. Duplicate one to make changes.", "error");
      return false;
    }
    return true;
  }

  function questionTemplate(type, origin = "manual") {
    const question = {
      id: localId("question"),
      type,
      text: "",
      topic: "",
      difficulty: assessment?.difficulty || "Medium",
      marks: Number(type === "mcq" ? assessment?.mcqMarks : assessment?.essayMarks) || 1,
      options: type === "mcq" ? ["", "", "", ""].map((text) => ({ id: localId("option"), text })) : [],
      correctIndex: null,
      explanation: "",
      modelAnswer: "",
      rubric: type === "essay" ? [{
        id: localId("criterion"),
        name: "",
        evaluates: "",
        marks: Number(assessment?.essayMarks) || 1,
        keyPoints: "",
        fullCredit: "",
        partialCredit: "",
        noCredit: ""
      }] : [],
      origin,
      needsReview: origin !== "manual"
    };
    return question;
  }

  function captureForm(form) {
    const data = new FormData(form);
    if (form.elements.namedItem("duration_min")) {

      assessment.duration_min =
        Number(data.get("duration_min"));

      assessment.pass_marks =
        Number(data.get("pass_marks"));

      assessment.max_attempt =
        Number(data.get("max_attempt"));

      assessment.shuffle_question =
        data.has("shuffle_question");

      assessment.shuffle_option =
        data.has("shuffle_option");

      assessment.start_date_time =
        data.get("start_date_time") || "";

    }
    for (const [key, value] of data.entries()) {
      if ([
        "duration_min",
        "pass_marks",
        "max_attempt",
        "shuffle_question",
        "shuffle_option",
        "start_date_time"
      ].includes(key)) continue;
      if (key === "lectureIds") continue;
      if (key.endsWith("Count") || key.endsWith("Marks") || key === "questionCount" || key === "marksPerQuestion") {
        assessment[key] = Number(value);
      } else {
        assessment[key] = value;
      }
    }
    const selected = form.querySelectorAll('input[name="lectureIds"]:checked');
    assessment.lectureIds = Array.from(selected, (item) => item.value);
    if (assessment.questionType !== "mixed") {
      assessment.mcqCount = assessment.questionType === "mcq" ? Number(assessment.questionCount) : 0;
      assessment.essayCount = assessment.questionType === "essay" ? Number(assessment.questionCount) : 0;
    }
  }

  function fillCourseOptions(control) {
    const placeholder = el("option", { value: "", text: "Select a course" });
    control.append(placeholder);
    courses.forEach((course) => control.append(el("option", {
      value: course.id,
      text: course.name
    })));
  }

  function renderMethodForm() {
    workspaceContent.replaceChildren();
    workspaceContent.hidden = false;
    questionList.replaceChildren();
    questionList.hidden = true;
    summary.hidden = true;
    builderVisible = false;
    workspace.hidden = false;
    byId("assessmentCreation").hidden = true;
    updateActionVisibility();
    const methodNames = { upload: "Upload Existing Assessment", manual: "Create Manually", ai: "Generate with AI" };
    byId("workspaceTitle").textContent = methodNames[assessment.method];
    byId("workspaceDescription").textContent = assessment.method === "ai"
      ? "AI generation is simulated. Review generated content before use."
      : assessment.method === "upload"
        ? "Upload a document to create editable sample questions for teacher review."
        : "Configure your assessment, then build and edit its questions.";
    const form = el("form", { className: "as-config-form", "data-config-form": "true" });
    form.addEventListener("submit", (event) => event.preventDefault());
    form.append(input("Assessment title", assessment.title, {
      name: "title", required: true, placeholder: "e.g. Unit 1 Review"
    }));
    const courseControl = el("select", { className: "form-control", name: "courseId", required: true });
    fillCourseOptions(courseControl);
    courseControl.value = assessment.courseId;
    form.append(labelField(
      assessment.method === "ai" ? "Existing courses" : "Course",
      courseControl
    ));

    if (assessment.method === "upload") {
      form.append(input("Approximate sample question count", assessment.questionCount, {
        type: "number", name: "questionCount", min: "1", max: "5", value: assessment.questionCount
      }));
      form.append(uploadZone("assessment"));
      form.append(el("p", {
        className: "as-note",
        text: `Mock extraction only. Supported: ${api.config.supportedAssessmentFormats.join(", ").toUpperCase()}. No document contents are extracted.`
      }));
      form.append(el("div", { className: "as-actions" }, [
        button("Extract Questions", "extract-questions", "scan-text", "btn btn-primary"),
        button("Cancel", "cancel-workflow", "x")
      ]));
    } else {
      const type = el("select", { className: "form-control", name: "questionType" });
      [["mcq", "MCQ"], ["essay", "Essay"], ["mixed", "Mixed"]].forEach(([value, name]) =>
        type.append(el("option", { value, text: name })));
      type.value = assessment.questionType;
      form.append(labelField("Question type", type));
      form.append(select("Difficulty", assessment.difficulty, [
        ["Easy", "Easy"], ["Medium", "Medium"], ["Hard", "Hard"]
      ], { name: "difficulty" }));
      if (assessment.questionType === "mixed") {
        form.append(input("MCQ question count", assessment.mcqCount, {
          type: "number", name: "mcqCount", min: "0", max: assessment.method === "ai" ? "10" : undefined
        }));
        form.append(input("MCQ marks per question", assessment.mcqMarks, {
          type: "number", name: "mcqMarks", min: "1", step: "1"
        }));
        form.append(input("Essay question count", assessment.essayCount, {
          type: "number", name: "essayCount", min: "0", max: assessment.method === "ai" ? "10" : undefined
        }));
        form.append(input("Essay marks per question", assessment.essayMarks, {
          type: "number", name: "essayMarks", min: "1", step: "1"
        }));
      } else {
        form.append(input("Number of questions", assessment.questionCount, {
          type: "number", name: "questionCount", min: "1", max: assessment.method === "ai" ? "10" : undefined
        }));
        const marksName = assessment.questionType === "mcq" ? "mcqMarks" : "essayMarks";
        const marksValue = assessment.questionType === "mcq" ? assessment.mcqMarks : assessment.essayMarks;
        form.append(input("Marks per question", marksValue, {
          type: "number", name: marksName, min: "1", step: "1"
        }));
      }
      if (assessment.method === "ai") {

        form.append(el("h3", {
          className: "as-subheading",
          text: "Course content"
        }));

        const lectureGroup = el("fieldset", {
          className: "as-lecture-list"
        });

        lectureGroup.append(el("legend", {
          text: "Select lectures"
        }));

        const availableLectures = lectures.filter(
          (lecture) => lecture.courseId === assessment.courseId
        );

        if (!assessment.courseId) {

          lectureGroup.append(el("p", {
            className: "as-note",
            text: "Select a course to view its lectures."
          }));

        } else if (!availableLectures.length) {

          lectureGroup.append(el("p", {
            className: "as-note",
            text: "No lectures are available for this course."
          }));

        } else {

          availableLectures.forEach((lecture) => {

            const checkbox = el("input", {
              type: "checkbox",
              name: "lectureIds",
              value: lecture.id
            });

            checkbox.checked =
              assessment.lectureIds.includes(lecture.id);

            lectureGroup.append(el("label", {
              className: "as-check-row"
            }, [
              checkbox,
              document.createTextNode(` ${lecture.title}`)
            ]));

          });

        }

        form.append(lectureGroup);

        form.append(el("p", {
          className: "as-note",
          text: "Simulated AI generation: no real AI provider or external generation service is used."
        }));

      }
      if (["manual", "ai"].includes(assessment.method)) {

        form.append(el("h3", {
          className: "as-subheading",
          text: "Assessment Settings"
        }));

        const settingsGrid = el("div", {
          className: "as-settings-grid"
        });

        settingsGrid.append(

          input("Duration (minutes)", assessment.duration_min ?? 60, {
            name: "duration_min",
            type: "number",
            min: "1",
            step: "1",
            required: true
          }),

          input("Pass marks", assessment.pass_marks ?? 1, {
            name: "pass_marks",
            type: "number",
            min: "0",
            step: "any",
            required: true
          }),

          input("Maximum attempts", assessment.max_attempt ?? 1, {
            name: "max_attempt",
            type: "number",
            min: "1",
            step: "1",
            required: true
          }),

          input("Start date & time", assessment.start_date_time ?? "", {
            name: "start_date_time",
            type: "datetime-local",
            required: true
          })

        );

        form.append(settingsGrid);

        const shuffleGroup = el("fieldset", {
          className: "as-lecture-list"
        });

        shuffleGroup.append(el("legend", {
          text: "Randomization"
        }));

        [
          ["shuffle_question", "Shuffle questions"],
          ["shuffle_option", "Shuffle options"]
        ].forEach(([name, label]) => {

          const checkbox = el("input", {
            type: "checkbox",
            name: name
          });

          checkbox.checked = Boolean(assessment[name]);

          shuffleGroup.append(el("label", {
            className: "as-check-row"
          }, [
            checkbox,
            document.createTextNode(` ${label}`)
          ]));

        });

        form.append(shuffleGroup);

      }

      const total = assessment.questionType === "mixed"
        ? Number(assessment.mcqCount) + Number(assessment.essayCount)
        : Number(assessment.questionCount);
      const totalMarks = assessment.questionType === "mixed"
        ? Number(assessment.mcqCount) * Number(assessment.mcqMarks) +
        Number(assessment.essayCount) * Number(assessment.essayMarks)
        : total * Number(assessment.questionType === "mcq" ? assessment.mcqMarks : assessment.essayMarks);
      form.append(el("p", {
        className: "as-total-line",
        "data-config-total": "true",
        text: `Total questions: ${total} · Total marks: ${totalMarks || 0}${assessment.method === "ai" ? ` · AI maximum: ${api.config.maxAiQuestions}` : ""}`
      }));
      form.append(el("div", { className: "as-actions" }, [
        button(assessment.method === "ai" ? "Generate Questions" : "Build Question Set",
          assessment.method === "ai" ? "generate-questions" : "build-manual",
          assessment.method === "ai" ? "sparkles" : "file-plus-2",
          "btn btn-primary"),
        button("Cancel", "cancel-workflow", "x")
      ]));
    }
    workspaceContent.append(form);
    if (assessment.method === "ai" && assessment.materials.length) renderMaterialChips();
    workspace.hidden = false;
    updateActionVisibility();
    refreshIcons();
    byId("workspaceTitle").focus?.();
  }

  function uploadZone(kind) {
    const isAssessment = kind === "assessment";
    const field = el("div", { className: "as-upload-field" });
    const drop = el("div", {
      className: "as-dropzone",
      role: "button",
      tabindex: "0",
      "data-dropzone": kind,
      "aria-label": isAssessment ? "Choose assessment file" : "Choose lecture material"
    }, [
      icon("upload-cloud"),
      el("strong", { text: isAssessment ? "Drop your assessment here" : "Drop lecture materials here" }),
      el("span", { text: "or" }),
      button("Browse files", `browse-${kind}`, "folder-open")
    ]);
    const fileInput = el("input", {
      className: "as-file-input",
      type: "file",
      accept: (isAssessment ? api.config.supportedAssessmentFormats : api.config.supportedLectureFormats)
        .map((extension) => `.${extension}`).join(","),
      "data-file-input": kind,
      tabindex: "-1",
      "aria-label": isAssessment ? "Assessment file" : "Lecture material file"
    });
    field.append(drop, fileInput);
    if (isAssessment && originalFile) {
      field.append(el("div", { className: "as-file-chip" }, [
        el("span", { text: `${originalFile.name} · ${humanSize(originalFile.size)}` }),
        button("Remove", "remove-assessment-file", "trash-2")
      ]));
    }
    return field;
  }

  function renderMaterialChips() {
    const container = $("[data-material-list]", workspaceContent);
    if (!container) return;
    container.replaceChildren();
    assessment.materials.forEach((material, index) => {
      container.append(el("div", { className: "as-file-chip" }, [
        el("span", { text: `${material.name} · ${humanSize(material.size)}` }),
        el("button", { type: "button", className: "btn btn-secondary", "data-action": "remove-material", "data-index": index },
          [icon("x"), document.createTextNode(" Remove")])
      ]));
    });
  }

  function updateActionVisibility() {
    const actions = byId("workspaceActions");
    actions.hidden = !builderVisible;
    const toolbar = $(".as-question-toolbar", workspace);
    if (toolbar) toolbar.hidden = !builderVisible;
  }

  function showBuilder(questions) {
    assessment.questions = questions;
    builderVisible = true;
    workspaceContent.hidden = true;
    questionList.hidden = false;
    summary.hidden = false;
    renderQuestions();
    renderSummary();
    updateActionVisibility();
    renderMethodControls();
    byId("assessmentSummary").scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function renderMethodControls() {
    const toolbar = el("div", { className: "as-question-toolbar" });
    const addSelect = el("select", { className: "form-control", "data-add-type": "true", "aria-label": "Question type to add" });
    addSelect.append(el("option", { value: "mcq", text: "Add MCQ" }));
    addSelect.append(el("option", { value: "essay", text: "Add Essay" }));
    toolbar.append(addSelect, button("Add Question", "add-question", "plus", "btn btn-primary"));
    const old = $(".as-question-toolbar", workspace);
    old?.remove();
    workspaceContent.after(toolbar);
    toolbar.hidden = !builderVisible;
  }

  function getCourseName(courseId) {
    return courses.find((course) => course.id === courseId)?.name || "Not selected";
  }

  function getAssessmentErrors() {
    const errors = [];
    if (!assessment?.title?.trim()) errors.push("Add an assessment title.");
    if (!assessment?.courseId) errors.push("Select a course.");
    if (!assessment?.questions?.length) errors.push("Add at least one question.");
    assessment?.questions?.forEach((question, index) => {
      errors.push(...api.validateQuestion(question, index));
    });
    return errors;
  }

  function renderSummary() {
    if (!assessment) return;
    const questions = assessment.questions || [];
    const mcqCount = questions.filter((question) => question.type === "mcq").length;
    const essayCount = questions.length - mcqCount;
    const totalMarks = questions.reduce((sum, question) => sum + (Number(question.marks) || 0), 0);
    const difficulties = [...new Set(questions.map((question) => question.difficulty).filter(Boolean))].join(", ") || "Not set";
    const errors = getAssessmentErrors();
    const methodName = { upload: "Upload (mock extraction)", manual: "Manual", ai: "AI (simulated)" }[assessment.method];
    summary.replaceChildren(
      el("div", { className: "as-summary-heading" }, [
        el("div", {}, [
          el("h3", { text: assessment.title || "Untitled assessment" }),
          el("p", { text: `${getCourseName(assessment.courseId)} · ${methodName}` })
        ]),
        el("span", {
          className: `as-validation-status ${errors.length ? "invalid" : "valid"}`,
          text: errors.length ? `${errors.length} item(s) need attention` : "Ready to publish"
        })
      ]),
      el("div", { className: "as-summary-stats" }, [
        el("span", { text: `Questions: ${questions.length}` }),
        el("span", { text: `MCQ: ${mcqCount}` }),
        el("span", { text: `Essay: ${essayCount}` }),
        el("span", { text: `Total marks: ${totalMarks}` }),
        el("span", { text: `Difficulty: ${difficulties}` })
      ])
    );
    const metadata = el("div", { className: "as-field-grid as-summary-fields" });
    const titleInput = el("input", {
      className: "form-control",
      value: assessment.title,
      required: true,
      "data-assessment-field": "title"
    });
    metadata.append(labelField("Assessment title", titleInput));
    const courseSelect = el("select", {
      className: "form-control",
      "data-assessment-field": "courseId",
      required: true
    });
    fillCourseOptions(courseSelect);
    courseSelect.value = assessment.courseId;
    metadata.append(labelField("Course", courseSelect));
    summary.insertBefore(metadata, summary.children[1]);
    if (errors.length) summary.append(el("ul", { className: "as-validation-list" },
      errors.slice(0, 5).map((error) => el("li", { text: error }))));
    const hasEssay = assessment.questions.some((question) => question.type === "essay");
    if (hasEssay) {
      summary.append(el("label", { className: "as-check-row as-rubric-toggle" }, [
        el("input", { type: "checkbox", "data-assessment-field": "showRubricToStudents", checked: assessment.showRubricToStudents }),
        document.createTextNode(" Show rubric to students before submission")
      ]));
    } else {
      assessment.showRubricToStudents = false;
    }
  }

  function questionInput(question, field, label, value, attrs = {}) {
    const { multiline, math, ...controlAttrs } = attrs;
    const controlAttrsForField = {
      "data-question-field": field,
      "data-question-id": question.id
    };
    const control = math
      ? window.eduMathInput.createField(value, {
        ...controlAttrsForField,
        "aria-label": label,
        "aria-multiline": String(Boolean(multiline)),
        ...(multiline ? { "data-rows": String(controlAttrs.rows || 3) } : {})
      })
      : multiline
        ? el("textarea", { className: "form-control", ...controlAttrsForField, rows: controlAttrs.rows || 3 })
        : el("input", { className: "form-control", ...controlAttrsForField, value, ...controlAttrs });
    const fieldControl = math
      ? el("div", { className: "edu-math-input" }, [control, window.eduMathInput.createButton(control, label)])
      : control;
    const fieldElement = labelField(label, fieldControl);
    if (field.startsWith("rubric.")) fieldElement.dataset.rubricField = field.split(".").pop();
    return fieldElement;
  }
  let draggedQuestionId = null;

  function moveQuestion(questionId, targetIndex) {

    const questions = assessment.questions;

    const currentIndex = questions.findIndex(
      (question) => question.id === questionId
    );

    if (
      currentIndex === -1 ||
      targetIndex < 0 ||
      targetIndex >= questions.length ||
      currentIndex === targetIndex
    ) return;

    const [movedQuestion] =
      questions.splice(currentIndex, 1);

    questions.splice(targetIndex, 0, movedQuestion);

    renderQuestions();
    renderSummary();

  }

  function renderQuestions() {
    questionList.replaceChildren();
    assessment.questions.forEach((question, index) => {
      const details = el("details", { className: "as-question-card", "data-question-card": question.id });
      details.open = expandedQuestions.has(question.id) || index === 0;
      details.addEventListener("toggle", () => {
        if (details.open) expandedQuestions.add(question.id);
        else expandedQuestions.delete(question.id);
      });
      const prompt = el("span", { className: "as-question-prompt" });
      window.eduMathInput.renderInline(prompt, question.text || "Untitled question");
      const dragHandle = el("span", {
        className: "as-drag-handle",
        draggable: "true",
        title: "Drag to reorder question",
        "aria-label": "Drag to reorder question"
      }, [
        el("i", {
          "data-lucide": "grip-vertical"
        })
      ]);

      dragHandle.draggable = true;

      dragHandle.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
      });

      dragHandle.addEventListener("dragstart", (event) => {

        draggedQuestionId = question.id;

        event.dataTransfer.effectAllowed = "move";

        event.dataTransfer.setData(
          "application/x-assessment-question",
          question.id
        );

        details.classList.add("as-dragging");

      });

      dragHandle.addEventListener("dragend", () => {

        draggedQuestionId = null;

        questionList
          .querySelectorAll(".as-question-card")
          .forEach((card) => {
            card.classList.remove(
              "as-dragging",
              "as-drag-over"
            );
          });

      });

      details.addEventListener("dragover", (event) => {

        if (
          !draggedQuestionId ||
          draggedQuestionId === question.id
        ) return;

        event.preventDefault();

        event.dataTransfer.dropEffect = "move";

        details.classList.add("as-drag-over");

      }, true);

      details.addEventListener("dragleave", (event) => {

        if (!details.contains(event.relatedTarget)) {
          details.classList.remove("as-drag-over");
        }

      });

      details.addEventListener("drop", (event) => {

        if (!draggedQuestionId) return;

        event.preventDefault();
        event.stopPropagation();

        const sourceId = draggedQuestionId;

        draggedQuestionId = null;

        questionList
          .querySelectorAll(".as-question-card")
          .forEach((card) => {
            card.classList.remove(
              "as-dragging",
              "as-drag-over"
            );
          });

        moveQuestion(sourceId, index);

      }, true);
      const summaryRow = el("summary", { className: "as-question-summary" }, [
        dragHandle,
        el("span", { className: "as-question-number", text: `Question ${index + 1}` }),
        el("span", { className: "as-question-type", text: question.type.toUpperCase() }),
        prompt,
        el("span", { className: "as-question-marks", text: `${Number(question.marks) || 0} marks` })
      ]);
      details.append(summaryRow);
      const reorderControls = el("div", {
        className: "as-reorder-controls"
      });

      [
        [-1, "arrow-up", "Move up"],
        [1, "arrow-down", "Move down"]
      ].forEach(([direction, icon, label]) => {

        const targetIndex = index + direction;

        const control = el("button", {
          type: "button",
          className: "as-reorder-btn",
          title: label,
          "aria-label": `${label} question ${index + 1}`
        }, [
          el("i", {
            "data-lucide": icon
          })
        ]);

        control.disabled =
          targetIndex < 0 ||
          targetIndex >= assessment.questions.length;

        control.addEventListener("click", (event) => {

          event.preventDefault();
          event.stopPropagation();

          moveQuestion(question.id, targetIndex);

        });

        reorderControls.append(control);

      });

      details.append(reorderControls);
      const actions = el("div", { className: "as-question-actions", "data-no-toggle": "true" });
      actions.append(button("Duplicate", "duplicate-question", "copy"));
      if (question.origin === "ai") actions.append(button("Regenerate", "regenerate-question", "refresh-cw"));
      actions.append(button("Delete", "delete-question", "trash-2"));
      actions.querySelectorAll("[data-action]").forEach((control) => {
        control.dataset.questionId = question.id;
      });
      details.append(actions);
      const body = el("div", { className: "as-question-body" });
      body.append(questionInput(question, "text", "Question text", question.text, {
        multiline: true, rows: 3, required: true, math: true
      }));
      const common = el("div", { className: "as-field-grid" }, [
        questionInput(question, "topic", "Topic", question.topic),
        select("Difficulty", question.difficulty, [["Easy", "Easy"], ["Medium", "Medium"], ["Hard", "Hard"]], {
          "data-question-field": "difficulty", "data-question-id": question.id
        }),
        questionInput(question, "marks", "Question marks", question.marks, {
          type: "number", min: "1", step: "1"
        })
      ]);
      body.append(common);
      if (question.needsReview) body.append(el("p", {
        className: "as-review-flag",
        text: "Teacher review required: this is mock sample content and may be missing answers, marks, model answers, or rubric details."
      }));

      if (question.type === "mcq") {
        body.append(el("h4", { className: "as-subheading", text: "Answer options — choose the correct answer" }));
        question.options.forEach((option, optionIndex) => {
          const optionText = window.eduMathInput.createField(option.text, {
            "data-option-field": "text",
            "data-question-id": question.id,
            "data-option-id": option.id,
            "aria-label": `Question ${index + 1}, option ${optionIndex + 1}`,
            "aria-multiline": "false"
          });
          const optionEditor = el("div", { className: "edu-math-input" }, [
            optionText,
            window.eduMathInput.createButton(optionText, `Question ${index + 1}, option ${optionIndex + 1}`)
          ]);
          const correct = el("input", {
            type: "radio",
            name: `correct-${question.id}`,
            value: option.id,
            checked: question.options[question.correctIndex]?.id === option.id,
            "data-correct-option": "true",
            "data-question-id": question.id
          });
          const optionRow = el("div", { className: "as-option-row" }, [
            el("label", { className: "as-correct-choice", "aria-label": `Mark option ${optionIndex + 1} correct` }, [correct]),
            optionEditor,
            el("span", { className: "as-option-letter", text: String.fromCharCode(65 + optionIndex) })
          ]);
          if (question.options.length > 2) optionRow.append(
            el("button", { type: "button", className: "btn btn-secondary", "data-action": "remove-option", "data-question-id": question.id, "data-option-id": option.id, "aria-label": `Remove option ${optionIndex + 1}` }, icon("x"))
          );
          body.append(optionRow);
        });
        const addOptionButton = button("Add option", "add-option", "plus");
        addOptionButton.dataset.questionId = question.id;
        body.append(addOptionButton);
        body.append(questionInput(question, "explanation", "Optional answer explanation (teacher only)", question.explanation, {
          multiline: true, rows: 2, math: true
        }));
      } else {
        body.append(questionInput(question, "modelAnswer", "Expected / model answer (teacher only)", question.modelAnswer, {
          multiline: true, rows: 3, math: true
        }));
        body.append(el("div", { className: "as-rubric-heading" }, [
          el("h4", { className: "as-subheading", text: "Grading rubric" }),
          el("span", {
            className: `as-rubric-total ${rubricTotal(question) === Number(question.marks) ? "valid" : "invalid"}`,
            text: `Rubric total: ${rubricTotal(question)} / ${Number(question.marks) || 0} marks`
          })
        ]));
        question.rubric.forEach((criterion, criterionIndex) => {
          const rubric = el("fieldset", { className: "as-rubric-criterion" });
          rubric.append(el("legend", { text: `Criterion ${criterionIndex + 1}` }));
          const grid = el("div", { className: "as-rubric-grid" });
          ["name", "marks", "evaluates", "keyPoints", "fullCredit", "partialCredit", "noCredit"].forEach((field) => {
            const labels = {
              name: "Criterion name",
              evaluates: "What it evaluates",
              marks: "Maximum marks",
              keyPoints: "Expected key points (one per line)",
              fullCredit: "Full credit description",
              partialCredit: "Partial credit description",
              noCredit: "No credit description"
            };
            const isText = !["name", "marks"].includes(field);
            grid.append(questionInput(question, `rubric.${criterion.id}.${field}`, labels[field],
              criterion[field], isText ? { multiline: true, rows: field === "keyPoints" ? 3 : 2 } : {
                ...(field === "marks" ? { type: "number", min: "1", step: "1" } : {}),
                value: criterion[field]
              }));
          });
          rubric.append(grid);
          if (question.rubric.length > 1) {
            const removeCriterionButton = button("Remove criterion", "remove-criterion", "trash-2");
            removeCriterionButton.dataset.questionId = question.id;
            rubric.append(removeCriterionButton);
          }
          body.append(rubric);
        });
        const addCriterionButton = button("Add rubric criterion", "add-criterion", "plus");
        addCriterionButton.dataset.questionId = question.id;
        body.append(addCriterionButton);
      }
      details.append(body);
      questionList.append(details);
    });
    refreshIcons();
  }

  function rubricTotal(question) {
    return (question.rubric || []).reduce((total, criterion) => total + (Number(criterion.marks) || 0), 0);
  }

  function updateQuestion(questionId, field, value) {
    const question = assessment.questions.find((item) => item.id === questionId);
    if (!question) return;
    if (field.startsWith("rubric.")) {
      const [, criterionId, key] = field.split(".");
      const criterion = question.rubric.find((item) => item.id === criterionId);
      if (criterion) criterion[key] = key === "marks" ? Number(value) : value;
    } else if (field === "marks") question.marks = Number(value);
    else question[field] = value;
    updateQuestionSummary(questionId);
    renderSummary();
  }

  function updateQuestionSummary(questionId) {
    const question = assessment.questions.find((item) => item.id === questionId);
    const card = $(`[data-question-card="${CSS.escape(questionId)}"]`);
    if (!question || !card) return;
    const prompt = $(".as-question-prompt", card);
    const marks = $(".as-question-marks", card);
    if (prompt) {
      prompt.replaceChildren();
      window.eduMathInput.renderInline(prompt, question.text || "Untitled question");
    }
    if (marks) marks.textContent = `${Number(question.marks) || 0} marks`;
    const rubricStatus = $(".as-rubric-total", card);
    if (rubricStatus) {
      rubricStatus.textContent = `Rubric total: ${rubricTotal(question)} / ${Number(question.marks) || 0} marks`;
      const balanced = Math.abs(rubricTotal(question) - Number(question.marks)) <= 0.001;
      rubricStatus.classList.toggle("valid", balanced);
      rubricStatus.classList.toggle("invalid", !balanced);
    }
  }

  function validateAndShow() {
    const errors = getAssessmentErrors();
    renderSummary();
    if (errors.length) {
      setFeedback(`Please fix the following before publishing:\n${errors.join("\n")}`, "error");
      summary.scrollIntoView({ block: "center", behavior: "smooth" });
      return false;
    }
    return true;
  }

  function renderSavedAssessments(items) {
    const statusFilter = byId("savedStatusFilter").value;
    const methodFilter = byId("savedMethodFilter").value;
    const query = searchTerm.trim().toLowerCase();
    const filtered = items.filter((item) => {
      const courseName = getCourseName(item.courseId);
      return (statusFilter === "all" || item.status === statusFilter) &&
        (methodFilter === "all" || item.method === methodFilter) &&
        (!query || `${item.title} ${courseName}`.toLowerCase().includes(query));
    });
    savedList.replaceChildren();
    if (!filtered.length) {
      savedList.append(el("div", { className: "as-empty-state" }, [
        icon("clipboard-list"),
        el("h3", { text: items.length ? "No matching assessments" : "No assessments yet" }),
        el("p", { text: items.length ? "Try changing the search or filters." : "Create your first assessment to get started." })
      ]));
      refreshIcons();
      return;
    }
    const grid = el("div", { className: "as-saved-grid" });
    filtered.forEach((item) => {
      const totalMarks = (item.questions || []).reduce((sum, question) => sum + (Number(question.marks) || 0), 0);
      const card = el("article", { className: "as-saved-card" }, [
        el("div", { className: "as-saved-card-heading" }, [
          el("h3", { text: item.title || "Untitled assessment" }),
          el("span", { className: `as-status-badge ${item.status}`, text: item.status })
        ]),
        el("p", { text: `${getCourseName(item.courseId)} · ${item.method === "ai" ? "AI (simulated)" : item.method}` }),
        el("p", { text: `${item.questions?.length || 0} questions · ${totalMarks} marks` }),
        el("small", { text: `Updated ${new Date(item.updatedAt).toLocaleString()}` })
      ]);
      const actions = el("div", { className: "as-saved-actions" });
      if (item.status === "draft") actions.append(
        button("Edit Draft", "edit-saved", "file-pen-line")
      );
      actions.append(
        button("Preview", "preview-saved", "eye"),
        button("Duplicate", "duplicate-saved", "copy"),
        button("Delete", "delete-saved", "trash-2")
      );
      if (item.status === "draft") actions.append(
        button("Publish Draft", "publish-saved", "send", "btn btn-primary")
      );
      [...actions.querySelectorAll("[data-action]")].forEach((control) => {
        control.dataset.assessmentId = item.id;
      });
      card.append(actions);
      grid.append(card);
    });
    savedList.append(grid);
    refreshIcons();
  }

  async function loadSaved() {
    try {
      const result = await api.getSavedAssessments();
      renderSavedAssessments(result.data);
    } catch (error) {
      setFeedback(error.message, "error");
    }
  }

  function makePreview(item) {
    const previewQuestions = item.questions || [];
    const hasEssay = previewQuestions.some((question) => question.type === "essay");
    const preview = el("div", { className: "as-student-preview" }, [
      el("h3", { text: item.title || "Untitled assessment" }),
      el("p", { text: `${getCourseName(item.courseId)} · ${previewQuestions.length} questions` })
    ]);
    previewQuestions.forEach((question, index) => {
      const block = el("section", { className: "as-preview-question" }, [
        el("h4", { text: `Question ${index + 1} · ${Number(question.marks) || 0} marks` })
      ]);
      const questionText = el("p");
      window.eduMathInput.renderInline(questionText, question.text || "Question text not provided.");
      block.append(questionText);
      if (question.type === "mcq") {
        const options = el("ol", { type: "A" });
        question.options.filter((option) => option.text?.trim()).forEach((option) => {
          const optionElement = el("li");
          window.eduMathInput.renderInline(optionElement, option.text);
          options.append(optionElement);
        });
        block.append(options);
      } else {
        block.append(el("div", { className: "as-answer-space", text: "Write your answer here." }));
        if (item.showRubricToStudents && hasEssay) {
          const visibleRubric = el("ul", { className: "as-preview-rubric", "aria-label": "Grading criteria" });
          (question.rubric || []).forEach((criterion) => {
            visibleRubric.append(el("li", {
              text: `Criterion ${visibleRubric.childElementCount + 1} (${Number(criterion.marks) || 0} marks)`
            }));
          });
          if (question.rubric?.length) block.append(visibleRubric);
        }
      }
      preview.append(block);
    });
    previewContent.replaceChildren(preview);
    if (typeof previewDialog.showModal === "function") previewDialog.showModal();
    else previewDialog.setAttribute("open", "");
    refreshIcons();
    $("button[data-action='close-preview']", previewDialog)?.focus();
  }

  async function saveDraft() {
    if (!assessment || saving) return;
    captureCurrentForm();
    saving = true;
    try {
      const saved = await api.saveDraft(assessment);
      assessment = saved.data;
      setFeedback("Draft saved in this browser (mock API).", "success");
      await loadSaved();
    } catch (error) {
      setFeedback(error.message, "error");
    } finally {
      saving = false;
    }
  }

  function captureCurrentForm() {
    const form = $("[data-config-form]", workspaceContent);
    if (form) captureForm(form);
    if (assessment && !assessment.id) assessment.status = "draft";
  }

  async function doPublish(item = assessment) {
    if (!item || saving) return;
    if (item === assessment) captureCurrentForm();
    const errors = api.validatePublish(item);
    if (errors.length) {
      setFeedback(`Cannot publish yet:\n${errors.join("\n")}`, "error");
      if (item === assessment && builderVisible) renderSummary();
      return;
    }
    if (!window.confirm("Publish this assessment? This is a simulation and will not deliver it to students.")) return;
    saving = true;
    try {
      const result = await api.publishAssessment(item);
      setFeedback("Published in mock mode only. No students received this assessment.", "success");
      if (item === assessment) {
        assessment = result.data;
        workspace.hidden = true;
        byId("assessmentCreation").hidden = false;
        assessment = null;
      }
      await loadSaved();
    } catch (error) {
      setFeedback(error.message, "error");
    } finally {
      saving = false;
    }
  }

  function resetWorkspace() {
    workspace.hidden = true;
    byId("assessmentCreation").hidden = false;
    workspaceContent.replaceChildren();
    workspaceContent.hidden = false;
    questionList.replaceChildren();
    questionList.hidden = true;
    $(".as-question-toolbar", workspace)?.remove();
    summary.hidden = true;
    summary.replaceChildren();
    assessment = null;
    originalFile = null;
    builderVisible = false;
    expandedQuestions.clear();
    setFeedback("");
    updateActionVisibility();
  }

  function hasUnsavedWork() {
    if (!assessment) return false;
    const defaults = defaultAssessment(assessment.method);
    const configurationChanged = assessment.questionType !== defaults.questionType ||
      assessment.questionCount !== defaults.questionCount ||
      assessment.difficulty !== defaults.difficulty ||
      assessment.mcqMarks !== defaults.mcqMarks ||
      assessment.essayMarks !== defaults.essayMarks ||
      (assessment.questionType === "mixed" &&
        (assessment.mcqCount !== defaults.mcqCount || assessment.essayCount !== defaults.essayCount));
    return Boolean(
      assessment.title.trim() ||
      assessment.courseId ||
      originalFile ||
      assessment.questions.length ||
      assessment.pastedText.trim() ||
      assessment.instructions.trim() ||
      assessment.lectureIds.length ||
      assessment.materials.length ||
      assessment.showRubricToStudents ||
      configurationChanged
    );
  }

  function confirmDiscard() {
    captureCurrentForm();
    if (!hasUnsavedWork()) {
      resetWorkspace();
      return true;
    }
    if (!window.confirm("Discard the current unsaved assessment edits? Saved drafts will remain available.")) return false;
    resetWorkspace();
    return true;
  }

  async function selectFile(file, kind) {
    if (!file) return;
    if (kind === "assessment" && originalFile &&
      originalFile.name !== file.name &&
      !window.confirm("Replace the currently selected assessment file?")) return;
    const allowed = kind === "assessment"
      ? api.config.supportedAssessmentFormats
      : api.config.supportedLectureFormats;
    const extension = file.name.split(".").pop().toLowerCase();
    if (!allowed.includes(extension)) {
      setFeedback(`Unsupported file type. Supported formats: ${allowed.join(", ").toUpperCase()}.`, "error");
      return;
    }
    if (!file.size) {
      setFeedback("The selected file is empty. Choose a non-empty file.", "error");
      return;
    }
    setFeedback("Uploading file metadata…", "info");
    try {
      if (kind === "assessment") {
        originalFile = file;
        renderMethodForm();
        setFeedback(`${file.name} selected (${humanSize(file.size)}). File contents are not stored.`, "success");
      } else {
        const result = await api.uploadLectureMaterial({ name: file.name, size: file.size }, assessment.courseId);
        assessment.materials.push(result.data);
        renderMaterialChips();
        setFeedback(`${file.name} added as a lecture source. Upload is simulated.`, "success");
      }
    } catch (error) {
      setFeedback(error.message, "error");
    }
  }

  async function handleClick(event) {
    const control = event.target.closest("[data-action], [data-method]");
    if (!control) return;
    if (control.dataset.method) {
      const radio = control.querySelector('input[type="radio"]');
      if (radio) {
        if (assessment && assessment.method !== radio.value && !confirmDiscard()) {
          event.preventDefault();
          return;
        }
        byId("assessmentContinue").disabled = false;
      }
      return;
    }
    const action = control.dataset.action;
    if (control.dataset.noToggle) return;
    if (action?.startsWith("browse-")) {
      $(`[data-file-input="${action.replace("browse-", "")}"]`, workspaceContent)?.click();
      return;
    }
    if (action === "continue") {
      const selected = $("input[name='assessmentMethod']:checked");
      if (!selected) return;
      if (assessment && assessment.method !== selected.value) {
        if (!confirmDiscard()) return;
      }
      if (!assessment) assessment = defaultAssessment(selected.value);
      workspace.hidden = false;
      renderMethodForm();
      return;
    }
    if (action === "cancel-workflow") {
      confirmDiscard();
      return;
    }
    if (action === "back-to-methods") {
      if (builderVisible) {
        captureCurrentForm();
        builderVisible = false;
        workspaceContent.hidden = false;
        questionList.hidden = true;
        summary.hidden = true;
        updateActionVisibility();
        if (!$("[data-config-form]", workspaceContent)) renderMethodForm();
        return;
      }
      workspace.hidden = true;
      byId("assessmentCreation").hidden = false;
      setFeedback("Your entries are kept while you choose a creation method.", "info");
      return;
    }
    if (action === "extract-questions") {
      captureCurrentForm();
      if (!assessment.title.trim() || !assessment.courseId) {
        setFeedback("Enter an assessment title and select a course first.", "error");
        return;
      }
      if (assessment.questions.length) {
        showBuilder(assessment.questions);
        setFeedback("Your existing question edits have been preserved.", "success");
        return;
      }
      if (!originalFile) {
        setFeedback("Choose a PDF or DOCX assessment file first.", "error");
        return;
      }
      control.disabled = true;
      setFeedback("Creating mock editable sample questions…", "info");
      try {
        const result = await api.extractAssessmentQuestions({
          name: originalFile.name, size: originalFile.size
        }, assessment);
        assessment.questions = result.data.questions;
        showBuilder(result.data.questions);
        setFeedback(result.data.message, "success");
      } catch (error) {
        setFeedback(error.message, "error");
      } finally {
        control.disabled = false;
      }
      return;
    }
    if (action === "build-manual") {
      captureCurrentForm();
      const count = assessment.questionType === "mixed"
        ? Number(assessment.mcqCount) + Number(assessment.essayCount)
        : Number(assessment.questionCount);
      const countsValid = assessment.questionType === "mixed"
        ? Number.isInteger(Number(assessment.mcqCount)) && Number(assessment.mcqCount) >= 0 &&
        Number.isInteger(Number(assessment.essayCount)) && Number(assessment.essayCount) >= 0 &&
        (Number(assessment.mcqCount) + Number(assessment.essayCount) > 0)
        : Number.isInteger(Number(assessment.questionCount)) && Number(assessment.questionCount) >= 1;
      const marksValid = Number(assessment.mcqMarks) > 0 && Number(assessment.essayMarks) > 0;
      if (!assessment.title.trim() || !assessment.courseId || !countsValid || !marksValid) {
        setFeedback("Enter a title, select a course, and configure at least one question.", "error");
        return;
      }
      if (assessment.questions.length) {
        showBuilder(assessment.questions);
        setFeedback("Your existing question edits have been preserved.", "success");
        return;
      }
      assessment.questions = assessment.questionType === "mixed"
        ? [
          ...Array(Number(assessment.mcqCount)).fill("mcq"),
          ...Array(Number(assessment.essayCount)).fill("essay")
        ].map((type) => questionTemplate(type))
        : Array.from({ length: count }, () =>
          questionTemplate(assessment.questionType));
      showBuilder(assessment.questions);
      setFeedback("Blank editable question cards are ready.", "success");
      return;
    }
    if (action === "generate-questions") {
      captureCurrentForm();
      const total = assessment.questionType === "mixed"
        ? Number(assessment.mcqCount) + Number(assessment.essayCount)
        : Number(assessment.questionCount);
      if (!assessment.title.trim() || !assessment.courseId) {
        setFeedback("Enter a title and select a course.", "error");
        return;
      }
      if (total < 1 || total > api.config.maxAiQuestions) {
        setFeedback(`Simulated AI generation supports 1–${api.config.maxAiQuestions} questions total. Add remaining questions manually after generation.`, "error");
        return;
      }
      const configValid = assessment.questionType === "mixed"
        ? Number.isInteger(Number(assessment.mcqCount)) && Number(assessment.mcqCount) >= 0 &&
        Number.isInteger(Number(assessment.essayCount)) && Number(assessment.essayCount) >= 0
        : Number.isInteger(Number(assessment.questionCount)) && Number(assessment.questionCount) >= 1;
      if (!configValid || Number(assessment.mcqMarks) <= 0 || Number(assessment.essayMarks) <= 0) {
        setFeedback("Question counts must be whole non-negative numbers and marks must be positive.", "error");
        return;
      }
      if (assessment.questions.length) {
        showBuilder(assessment.questions);
        setFeedback("Your existing question edits have been preserved.", "success");
        return;
      }
      const sourceMaterials = lectures.filter(
        (lecture) =>
          lecture.courseId === assessment.courseId &&
          assessment.lectureIds.includes(lecture.id)
      );

      if (!sourceMaterials.length) {
        setFeedback(
          "Select at least one lecture from your course.",
          "error"
        );
        return;
      }
      control.disabled = true;
      setFeedback("Generating simulated questions… Please review all generated content.", "info");
      try {
        const result = await api.generateAssessmentQuestions(assessment, sourceMaterials);
        showBuilder(result.data.questions);
        setFeedback(result.data.message, "success");
      } catch (error) {
        setFeedback(error.message, "error");
      } finally {
        control.disabled = false;
      }
      return;
    }
    if (action === "remove-assessment-file") {
      if (window.confirm("Remove the selected assessment file?")) {
        originalFile = null;
        renderMethodForm();
        setFeedback("Selected file removed.", "info");
      }
      return;
    }
    if (action === "remove-material") {
      const index = Number(control.dataset.index);
      if (window.confirm("Remove this lecture source from the current assessment?")) {
        assessment.materials.splice(index, 1);
        renderMaterialChips();
      }
      return;
    }
    if (action === "add-question") {
      if (!ensureEditable()) return;
      const type = $("[data-add-type]", workspace).value;
      const question = questionTemplate(type);
      assessment.questions.push(question);
      expandedQuestions.add(question.id);
      renderQuestions();
      renderSummary();
      return;
    }
    const questionId = control.dataset.questionId;
    if (action === "duplicate-question") {
      if (!ensureEditable()) return;
      const source = assessment.questions.find((item) => item.id === questionId);
      if (!source) return;
      const duplicate = JSON.parse(JSON.stringify(source));
      duplicate.id = localId("question");
      duplicate.origin = "manual";
      duplicate.needsReview = false;
      duplicate.options = duplicate.options.map((option) => ({
        ...option, id: localId("option")
      }));
      duplicate.rubric = duplicate.rubric.map((criterion) => ({
        ...criterion, id: localId("criterion")
      }));
      assessment.questions.splice(assessment.questions.indexOf(source) + 1, 0, duplicate);
      expandedQuestions.add(duplicate.id);
      renderQuestions();
      renderSummary();
      return;
    }
    if (action === "delete-question") {
      if (!ensureEditable()) return;
      if (!window.confirm("Delete this question and its current edits?")) return;
      assessment.questions = assessment.questions.filter((item) => item.id !== questionId);
      expandedQuestions.delete(questionId);
      renderQuestions();
      renderSummary();
      return;
    }
    if (action === "regenerate-question") {
      if (!ensureEditable()) return;
      const source = assessment.questions.find((item) => item.id === questionId);
      if (!source) return;
      if (!window.confirm("Replace this question and discard its current edits?")) return;
      const lectureResult =
        await api.getAvailableLectures(assessment.courseId);

      const sources = lectureResult.data.filter(
        (lecture) =>
          lecture.courseId === assessment.courseId &&
          assessment.lectureIds.includes(lecture.id)
      );
      control.disabled = true;
      try {
        const result = await api.regenerateQuestion(source, assessment, sources);
        assessment.questions[assessment.questions.indexOf(source)] = {
          ...result.data, id: source.id, marks: source.marks
        };
        renderQuestions();
        renderSummary();
        setFeedback("Question replaced with simulated content.", "success");
      } catch (error) {
        setFeedback(error.message, "error");
      } finally {
        control.disabled = false;
      }
      return;
    }
    if (action === "add-option") {
      const question = assessment.questions.find((item) => item.id === questionId);
      if (!question) return;
      question.options.push({ id: localId("option"), text: "" });
      renderQuestions();
      return;
    }
    if (action === "remove-option") {
      const question = assessment.questions.find((item) => item.id === questionId);
      if (!question || question.options.length <= 2) return;
      const optionIndex = question.options.findIndex((option) => option.id === control.dataset.optionId);
      if (optionIndex < 0) return;
      if (question.options[optionIndex].text &&
        !window.confirm("Remove this answer option and its current text?")) return;
      question.options.splice(optionIndex, 1);
      if (question.correctIndex === optionIndex) question.correctIndex = null;
      else if (question.correctIndex > optionIndex) question.correctIndex--;
      renderQuestions();
      renderSummary();
      return;
    }
    if (action === "add-criterion") {
      const question = assessment.questions.find((item) => item.id === questionId);
      if (!question) return;
      question.rubric.push({
        id: localId("criterion"),
        name: "", evaluates: "", marks: 1, keyPoints: "",
        fullCredit: "", partialCredit: "", noCredit: ""
      });
      renderQuestions();
      renderSummary();
      return;
    }
    if (action === "remove-criterion") {
      const question = assessment.questions.find((item) => item.id === questionId);
      if (!question || question.rubric.length <= 1) return;
      const rubric = control.closest(".as-rubric-criterion");
      if (!window.confirm("Remove this rubric criterion?")) return;
      const index = Array.from(rubric.parentElement.querySelectorAll(".as-rubric-criterion")).indexOf(rubric);
      question.rubric.splice(index, 1);
      renderQuestions();
      renderSummary();
      return;
    }
    if (action === "save-draft") {
      await saveDraft();
      return;
    }
    if (action === "preview") {
      captureCurrentForm();
      makePreview(assessment);
      return;
    }
    if (action === "publish") {
      await doPublish();
      return;
    }
    if (action === "close-preview") {
      previewDialog.close?.();
      return;
    }
    if (action === "refresh-saved") {
      await loadSaved();
      return;
    }
    if (action === "edit-saved") {
      try {
        const result = await api.getAssessmentById(control.dataset.assessmentId);
        assessment = result.data;
        originalFile = null;
        builderVisible = true;
        workspace.hidden = false;
        byId("assessmentCreation").hidden = true;
        byId("workspaceTitle").textContent = `Edit draft: ${assessment.title}`;
        byId("workspaceDescription").textContent = "Edit this saved draft. Published assessments are read-only.";
        workspaceContent.replaceChildren();
        workspaceContent.hidden = true;
        showBuilder(assessment.questions || []);
        setFeedback("Draft restored from local storage.", "success");
      } catch (error) {
        setFeedback(error.message, "error");
      }
      return;
    }
    if (action === "preview-saved") {
      try {
        const result = await api.getAssessmentById(control.dataset.assessmentId);
        makePreview(result.data);
      } catch (error) {
        setFeedback(error.message, "error");
      }
      return;
    }
    if (action === "duplicate-saved") {
      try {
        const result = await api.duplicateAssessment(control.dataset.assessmentId);
        await loadSaved();
        setFeedback("Assessment duplicated as a new draft.", "success");
        assessment = result.data;
        workspace.hidden = false;
        byId("assessmentCreation").hidden = true;
        builderVisible = true;
        byId("workspaceTitle").textContent = `Edit draft: ${assessment.title}`;
        byId("workspaceDescription").textContent = "Duplicated assessments are editable drafts.";
        workspaceContent.replaceChildren();
        workspaceContent.hidden = true;
        showBuilder(assessment.questions);
      } catch (error) {
        setFeedback(error.message, "error");
      }
      return;
    }
    if (action === "delete-saved") {
      if (!window.confirm("Delete this saved assessment permanently from this browser?")) return;
      try {
        await api.deleteAssessment(control.dataset.assessmentId);
        await loadSaved();
        setFeedback("Assessment deleted.", "success");
      } catch (error) {
        setFeedback(error.message, "error");
      }
      return;
    }
    if (action === "publish-saved") {
      try {
        const result = await api.getAssessmentById(control.dataset.assessmentId);
        await doPublish(result.data);
      } catch (error) {
        setFeedback(error.message, "error");
      }
    }
  }

  document.addEventListener("click", (event) => {
    void handleClick(event);
  });

  document.addEventListener("input", (event) => {
    const target = event.target;
    if (target.id === "teacherSearchInput" || target.id === "savedAssessmentSearch") {
      searchTerm = target.value;
      loadSaved();
      return;
    }
    if (target.matches("[data-question-field]")) {
      const value = target.matches(".edu-math-rich-editor")
        ? window.eduMathInput.serializeField(target)
        : target.value;
      updateQuestion(target.dataset.questionId, target.dataset.questionField, value);
    } else if (target.matches("[data-option-field]")) {
      const question = assessment?.questions.find((item) => item.id === target.dataset.questionId);
      const option = question?.options.find((item) => item.id === target.dataset.optionId);
      if (option) option.text = target.matches(".edu-math-rich-editor")
        ? window.eduMathInput.serializeField(target)
        : target.value;
      renderSummary();
    } else if (target.matches("[data-config-form] input, [data-config-form] textarea")) {
      captureCurrentForm();
      const totalLine = $("[data-config-total]", workspaceContent);
      if (totalLine) {
        const count = assessment.questionType === "mixed"
          ? Number(assessment.mcqCount) + Number(assessment.essayCount)
          : Number(assessment.questionCount);
        const marks = assessment.questionType === "mixed"
          ? Number(assessment.mcqCount) * Number(assessment.mcqMarks) +
          Number(assessment.essayCount) * Number(assessment.essayMarks)
          : count * Number(assessment.questionType === "mcq" ? assessment.mcqMarks : assessment.essayMarks);
        totalLine.textContent = `Total questions: ${count} · Total marks: ${marks || 0}${assessment.method === "ai" ? ` · AI maximum: ${api.config.maxAiQuestions}` : ""}`;
      }
    }
  });

  document.addEventListener("change", (event) => {
    const target = event.target;
    if (target.matches("[data-question-field]")) {
      const value = target.matches(".edu-math-rich-editor")
        ? window.eduMathInput.serializeField(target)
        : target.value;
      updateQuestion(target.dataset.questionId, target.dataset.questionField, value);
    } else if (target.matches("[data-option-field]")) {
      const question = assessment?.questions.find((item) => item.id === target.dataset.questionId);
      const option = question?.options.find((item) => item.id === target.dataset.optionId);
      if (option) option.text = target.matches(".edu-math-rich-editor")
        ? window.eduMathInput.serializeField(target)
        : target.value;
      renderSummary();
    } else if (target.matches("[data-correct-option]")) {
      const question = assessment?.questions.find((item) => item.id === target.dataset.questionId);
      const index = question?.options.findIndex((option) => option.id === target.value);
      if (question && index >= 0) question.correctIndex = index;
      renderSummary();
    } else if (target.matches("[data-assessment-field]")) {
      if (target.dataset.assessmentField === "showRubricToStudents") {
        assessment.showRubricToStudents = target.checked;
      } else {
        assessment[target.dataset.assessmentField] = target.value;
        const heading = $(".as-summary h3");
        const details = $(".as-summary-heading p");
        if (heading) heading.textContent = assessment.title || "Untitled assessment";
        if (details) {
          const methodName = { upload: "Upload (mock extraction)", manual: "Manual", ai: "AI (simulated)" }[assessment.method];
          details.textContent = `${getCourseName(assessment.courseId)} · ${methodName}`;
        }
      }
    } else if (target.matches("[data-file-input]")) {
      void selectFile(target.files?.[0], target.dataset.fileInput);
      target.value = "";
    } else if (target.matches("[data-config-form] select, [data-config-form] input")) {
      if (target.name === "questionType") {
        captureCurrentForm();
        renderMethodForm();
        return;
      }
      if (target.name === "courseId" && assessment.method === "ai") {

        captureCurrentForm();

        assessment.lectureIds = [];

        const selectedCourseId = assessment.courseId;

        api.getAvailableLectures(selectedCourseId)
          .then((result) => {

            if (assessment.courseId !== selectedCourseId) return;

            lectures = result.data;

            renderMethodForm();

          })
          .catch((error) => setFeedback(error.message, "error"));

      } else captureCurrentForm();
    } else if (target.id === "savedStatusFilter" || target.id === "savedMethodFilter") {
      loadSaved();
    }
  });

  document.addEventListener("dragover", (event) => {
    const zone = event.target.closest("[data-dropzone]");
    if (!zone) return;
    event.preventDefault();
    zone.classList.add("drag-over");
  });
  document.addEventListener("dragleave", (event) => {
    const zone = event.target.closest("[data-dropzone]");
    if (zone && !zone.contains(event.relatedTarget)) zone.classList.remove("drag-over");
  });
  document.addEventListener("drop", (event) => {
    const zone = event.target.closest("[data-dropzone]");
    if (!zone) return;
    event.preventDefault();
    zone.classList.remove("drag-over");
    void selectFile(event.dataTransfer?.files?.[0], zone.dataset.dropzone);
  });

  document.addEventListener("keydown", (event) => {
    const zone = event.target.closest?.("[data-dropzone]");
    if (zone && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      $(`[data-file-input="${zone.dataset.dropzone}"]`, workspaceContent)?.click();
    }
    if (event.key === "Escape") closeTeacherSidebar();
  });

  function closeTeacherSidebar() {
    const sidebar = byId("teacherSidebar");
    const backdrop = byId("teacherBackdrop");
    const menuButton = byId("teacherMenuBtn");
    sidebar?.classList.remove("open");
    backdrop?.classList.remove("open");
    if (backdrop) backdrop.hidden = true;
    menuButton?.setAttribute("aria-expanded", "false");
    menuButton?.setAttribute("aria-label", "Open sidebar");
  }
  function openTeacherSidebar() {
    const sidebar = byId("teacherSidebar");
    const backdrop = byId("teacherBackdrop");
    const menuButton = byId("teacherMenuBtn");
    sidebar?.classList.add("open");
    if (backdrop) {
      backdrop.hidden = false;
      backdrop.classList.add("open");
    }
    menuButton?.setAttribute("aria-expanded", "true");
    menuButton?.setAttribute("aria-label", "Close sidebar");
  }

  document.addEventListener("click", (event) => {
    if (event.target.closest("#teacherMenuBtn")) {
      if (byId("teacherMenuBtn")?.getAttribute("aria-expanded") === "true") closeTeacherSidebar();
      else openTeacherSidebar();
    }
    if (event.target.closest("#teacherBackdrop")) closeTeacherSidebar();
    const comingSoon = event.target.closest("[data-coming-soon]");
    if (comingSoon) {
      event.preventDefault();
      setFeedback(`${comingSoon.textContent.trim()} is coming soon. This destination is not available yet.`, "info");
      closeTeacherSidebar();
    }
    if (event.target.closest("#teacherLogoutBtn")) {
      setFeedback("Sign-out is not connected for the teacher demo, so no account state was changed.", "info");
    }
    if (event.target.closest("#teacherNotificationBtn, #teacherSidebarNotificationBtn")) {
      setFeedback("Teacher notifications are a mock panel. No notifications are connected yet.", "info");
      const current = $("#teacherNotificationBtn");
      const sidebarNotification = $("#teacherSidebarNotificationBtn");
      const panel = $("#teacherMockNotifications");
      const expanded = !panel;
      if (panel) panel.remove();
      else {
        const popover = el("section", {
          id: "teacherMockNotifications",
          className: "as-notification-popover",
          role: "status",
          text: "Mock notifications: teacher notifications are not connected yet."
        });
        current.closest(".sd-topbar")?.append(popover);
      }
      current?.setAttribute("aria-expanded", String(expanded));
      sidebarNotification?.setAttribute("aria-expanded", String(expanded));
    }
  });

  document.addEventListener("change", (event) => {
    if (event.target.matches("[data-method]")) {
      byId("assessmentContinue").disabled = false;
    }
  });

  async function start() {
    try {
      const result = await api.getCourses();
      courses = result.data;
      lectures = (await api.getAvailableLectures()).data;
      const continueButton = byId("assessmentContinue");
      continueButton.dataset.action = "continue";
      continueButton.disabled = true;
      document.querySelectorAll('input[name="assessmentMethod"]').forEach((radio) => {
        radio.dataset.method = radio.value;
      });
      await loadSaved();
      refreshIcons();
    } catch (error) {
      setFeedback(`Could not load assessment data: ${error.message}`, "error");
    }
  }

  void start();
}
