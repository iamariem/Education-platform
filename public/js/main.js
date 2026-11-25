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
