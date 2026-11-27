
/* =========================================
   EduSaaS - Centralized Mock API
========================================= */

(() => {

  "use strict";

  /* =========================================
     API CONFIGURATION
  ========================================= */

  const config = Object.freeze({

    assessmentStorageKey:
      "edusaas.assessments.v1",

    lectureStorageKey:
      "edusaas.assessment-lecture-materials.v1",

    studentAttemptStorageKey:
      "edusaas.student-assessment-attempts.v1",

    supportedAssessmentFormats: [
      "pdf",
      "docx"
    ],

    supportedLectureFormats: [
      "pdf",
      "pptx",
      "docx",
      "txt"
    ],

    maxAiQuestions: 10,

    latencyMs: 180

  });

  /* =========================================
     MOCK COURSES
  ========================================= */

  const courses = [

    {
      id: "course-neural-networks",
      name: "Neural Networks"
    },

    {
      id: "course-operating-systems",
      name: "Operating Systems"
    },

    {
      id: "course-data-structures",
      name: "Data Structures"
    }

  ];

  /* =========================================
     MOCK LECTURES
  ========================================= */

  const lectures = [

    {
      id: "lecture-nn-1",
      courseId: courses[0].id,
      title: "Neural Network Fundamentals"
    },

    {
      id: "lecture-nn-2",
      courseId: courses[0].id,
      title: "Training and Optimization"
    },

    {
      id: "lecture-os-1",
      courseId: courses[1].id,
      title: "Processes and Scheduling"
    },

    {
      id: "lecture-os-2",
      courseId: courses[1].id,
      title: "Memory Management"
    },

    {
      id: "lecture-ds-1",
      courseId: courses[2].id,
      title: "Trees and Graphs"
    }

  ];

  /* =========================================
     SHARED API HELPERS
  ========================================= */

  const delay = () =>
    new Promise(resolve =>
      setTimeout(resolve, config.latencyMs)
    );

  const clone = value =>
    JSON.parse(JSON.stringify(value));

  const makeId = prefix =>
    `${prefix}-${globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`
    }`;

  const now = () =>
    new Date().toISOString();

  const response = data => ({
    data: clone(data),
    error: null
  });

  const fail = message => {

    const error = new Error(message);

    error.name = "AssessmentApiError";

    throw error;

  };

  const extensionOf = (name = "") =>
    name.split(".").pop().toLowerCase();

  const roundMarks = value =>
    Math.round(value * 10000) / 10000;

  /* =========================================
     LOCAL STORAGE HELPERS
  ========================================= */

  function readList(key) {

    try {

      const value = JSON.parse(
        localStorage.getItem(key) || "[]"
      );

      return Array.isArray(value)
        ? value
        : [];

    } catch (error) {

      console.error(
        `Unable to read mock API data at "${key}".`,
        error
      );

      return [];

    }

  }

  function writeList(key, value) {

    try {

      localStorage.setItem(
        key,
        JSON.stringify(value)
      );

    } catch (error) {

      fail(
        `Could not persist mock assessment data: ${error.message}`
      );

    }

  }

  /* =========================================
     SHUFFLE ARRAY
  ========================================= */

  function shuffle(items) {

    const result = [...items];

    for (
      let index = result.length - 1;
      index > 0;
      index--
    ) {

      const randomIndex = Math.floor(
        Math.random() * (index + 1)
      );

      [
        result[index],
        result[randomIndex]
      ] = [
          result[randomIndex],
          result[index]
        ];

    }

    return result;

  }

  /* =========================================
     VALIDATE QUESTION
  ========================================= */

  function validateQuestion(question, index) {

    const label = `Question ${index + 1}`;

    const errors = [];

    if (!question.text?.trim()) {

      errors.push(
        `${label}: question text is required.`
      );

    }

    if (
      !Number.isFinite(Number(question.marks)) ||
      Number(question.marks) <= 0
    ) {

      errors.push(
        `${label}: marks must be greater than zero.`
      );

    }

    /* MCQ VALIDATION */

    if (question.type === "mcq") {

      const options = (
        question.options || []
      ).filter(
        option => option.text?.trim()
      );

      if (options.length < 2) {

        errors.push(
          `${label}: add at least two non-empty options.`
        );

      }

      if (
        !Number.isInteger(question.correctIndex) ||
        !question.options?.[
          question.correctIndex
        ]?.text?.trim()
      ) {

        errors.push(
          `${label}: select exactly one correct answer.`
        );

      }

    }

    /* ESSAY VALIDATION */

    if (question.type === "essay") {

      const rubricTotal = (
        question.rubric || []
      ).reduce(
        (sum, criterion) =>
          sum + Number(criterion.marks || 0),
        0
      );

      if (!question.modelAnswer?.trim()) {

        errors.push(
          `${label}: add a teacher-only model answer.`
        );

      }

      if (!question.rubric?.length) {

        errors.push(
          `${label}: add at least one rubric criterion.`
        );

      }

      if (
        Math.abs(
          rubricTotal - Number(question.marks)
        ) > 0.001
      ) {

        errors.push(
          `${label}: rubric marks (${rubricTotal}) must equal question marks (${question.marks}).`
        );

      }

      (question.rubric || []).forEach(
        (criterion, criterionIndex) => {

          const criterionLabel =
            `${label}, rubric criterion ${criterionIndex + 1}`;

          if (!criterion.name?.trim()) {

            errors.push(
              `${criterionLabel}: name is required.`
            );

          }

          if (!criterion.evaluates?.trim()) {

            errors.push(
              `${criterionLabel}: evaluation description is required.`
            );

          }

          if (
            !Number.isFinite(
              Number(criterion.marks)
            ) ||
            Number(criterion.marks) <= 0
          ) {

            errors.push(
              `${criterionLabel}: marks must be greater than zero.`
            );

          }

          if (
            !criterion.fullCredit?.trim() ||
            !criterion.partialCredit?.trim() ||
            !criterion.noCredit?.trim()
          ) {

            errors.push(
              `${criterionLabel}: complete full, partial, and no-credit descriptions.`
            );

          }

        }
      );

    }

    return errors;

  }

  /* =========================================
     VALIDATE ASSESSMENT BEFORE PUBLISH
  ========================================= */

  function validatePublish(assessment) {

    const errors = [];

    const duration =
      Number(assessment.duration_min);

    const passMarks =
      Number(assessment.pass_marks);

    const maxAttempts =
      Number(assessment.max_attempt);

    const totalMarks = (
      assessment.questions || []
    ).reduce(
      (sum, question) =>
        sum + Number(question.marks || 0),
      0
    );

    if (
      !Number.isInteger(duration) ||
      duration < 1
    ) {

      errors.push(
        "Duration must be at least 1 minute."
      );

    }

    if (
      assessment.pass_marks == null ||
      assessment.pass_marks === "" ||
      !Number.isFinite(passMarks) ||
      passMarks < 0 ||
      passMarks > totalMarks
    ) {

      errors.push(
        "Pass marks must be between zero and total assessment marks."
      );

    }

    if (
      !Number.isInteger(maxAttempts) ||
      maxAttempts < 1
    ) {

      errors.push(
        "Maximum attempts must be at least 1."
      );

    }

    if (
      !assessment.start_date_time ||
      Number.isNaN(
        Date.parse(assessment.start_date_time)
      )
    ) {

      errors.push(
        "Select a valid start date and time."
      );

    }

    if (!assessment.title?.trim()) {

      errors.push(
        "Assessment title is required."
      );

    }

    if (
      !courses.some(
        course => course.id === assessment.courseId
      )
    ) {

      errors.push(
        "Select a valid course."
      );

    }

    if (!assessment.questions?.length) {

      errors.push(
        "Add at least one question."
      );

    }

    assessment.questions?.forEach(
      (question, index) => {

        errors.push(
          ...validateQuestion(question, index)
        );

      }
    );

    return errors;

  }

  /* =========================================
     CREATE QUESTION TEMPLATE
  ========================================= */

  function makeQuestion(type, index, origin) {

    const id = makeId("question");

    const marks = 1;

    return {

      id,

      type,

      text: "",

      image: "",

      topic: "",

      difficulty: "Medium",

      marks,

      options: type === "mcq"

        ? ["", "", "", ""].map(text => ({
          id: makeId("option"),
          text
        }))

        : [],

      correctIndex: null,

      explanation: "",

      modelAnswer: "",

      rubric: type === "essay"

        ? [

          {
            id: makeId("criterion"),
            name: "",
            evaluates: "",
            marks,
            keyPoints: "",
            fullCredit: "",
            partialCredit: "",
            noCredit: ""
          }

        ]

        : [],

      origin,

      needsReview:
        origin === "import" ||
        origin === "ai"

    };

  }

  /* =========================================
     GET COURSES
  ========================================= */

  async function getCourses() {

    await delay();

    return response(courses);

  }

  /* =========================================
     GET AVAILABLE LECTURES
  ========================================= */

  async function getAvailableLectures(courseId) {

    await delay();

    return response(

      courseId

        ? lectures.filter(
          lecture =>
            lecture.courseId === courseId
        )

        : lectures

    );

  }

  /* =========================================
     UPLOAD LECTURE MATERIAL - MOCK
  ========================================= */

  async function uploadLectureMaterial(
    fileMetadata,
    courseId
  ) {

    await delay();

    const extension = extensionOf(
      fileMetadata?.name
    );

    if (
      !config.supportedLectureFormats.includes(
        extension
      )
    ) {

      fail(
        `Unsupported lecture material format. Use: ${config.supportedLectureFormats
          .join(", ")
          .toUpperCase()
        }.`
      );

    }

    if (
      !fileMetadata?.name ||
      !Number(fileMetadata.size)
    ) {

      fail(
        "Choose a non-empty lecture material file."
      );

    }

    const material = {

      id: makeId("material"),

      name: fileMetadata.name,

      size: Number(fileMetadata.size),

      format: extension,

      courseId: courseId || null,

      createdAt: now(),

      simulated: true

    };

    const materials = readList(
      config.lectureStorageKey
    );

    materials.push(material);

    writeList(
      config.lectureStorageKey,
      materials
    );

    return response(material);

  }

  /* =========================================
     EXTRACT ASSESSMENT QUESTIONS - MOCK
  ========================================= */

  async function extractAssessmentQuestions(
    fileMetadata,
    settings = {}
  ) {

    await delay();

    const extension = extensionOf(
      fileMetadata?.name
    );

    if (
      !config.supportedAssessmentFormats.includes(
        extension
      )
    ) {

      fail(
        `Unsupported assessment format. Use: ${config.supportedAssessmentFormats
          .join(", ")
          .toUpperCase()
        }.`
      );

    }

    if (
      !fileMetadata?.name ||
      !Number(fileMetadata.size)
    ) {

      fail(
        "Choose a non-empty assessment file."
      );

    }

    const count = Math.max(
      1,
      Math.min(
        5,
        Number(settings.questionCount) || 2
      )
    );

    return response({

      simulated: true,

      message:
        "Mock extraction only: these editable sample prompts were not read from the uploaded file.",

      questions: Array.from(
        { length: count },
        (_, index) => {

          const question = makeQuestion(

            index % 2 === 0
              ? "mcq"
              : "essay",

            index,

            "import"

          );

          question.text =
            `Mock extracted sample question ${index + 1} — replace with content reviewed from your document.`;

          question.topic =
            "Teacher review required";

          question.needsReview = true;

          return question;

        }
      )

    });

  }

  /* =========================================
     GENERATE ASSESSMENT QUESTIONS - MOCK AI
  ========================================= */

  async function generateAssessmentQuestions(
    assessment,
    sourceMaterials
  ) {

    await delay();

    const count =

      assessment.questions?.length ||

      (
        assessment.questionType === "mixed"

          ? Number(assessment.mcqCount || 0) +
          Number(assessment.essayCount || 0)

          : Number(assessment.questionCount || 0)
      );

    if (!sourceMaterials?.length) {

      fail(
        "Select at least one lecture from your course."
      );

    }

    if (
      !Number.isInteger(count) ||
      count < 1
    ) {

      fail(
        "Generate at least one question."
      );

    }

    if (count > config.maxAiQuestions) {

      fail(
        `AI generation is limited to ${config.maxAiQuestions} questions total.`
      );

    }

    const types =

      assessment.questionType === "mixed"

        ? [

          ...Array(
            Number(assessment.mcqCount) || 0
          ).fill("mcq"),

          ...Array(
            Number(assessment.essayCount) || 0
          ).fill("essay")

        ]

        : Array(count).fill(

          assessment.questionType === "essay"
            ? "essay"
            : "mcq"

        );

    return response({

      simulated: true,

      message:
        "Simulated AI output. Review and edit every question before use.",

      questions: types.map(
        (type, index) => {

          const question = makeQuestion(
            type,
            index,
            "ai"
          );

          question.text =
            `Simulated ${type === "mcq"
              ? "multiple-choice"
              : "essay"
            } question ${index + 1} — review and edit before use.`;

          question.topic =
            "Generated sample — verify";

          question.difficulty =
            assessment.difficulty || "Medium";

          question.marks = Number(

            type === "mcq"

              ? assessment.mcqMarks

              : assessment.essayMarks

          ) || 1;

          question.options =
            question.options.map(
              (option, optionIndex) => ({

                ...option,

                text:
                  `Sample option ${optionIndex + 1} — edit`

              })
            );

          question.rubric =

            type === "essay"

              ? [

                {
                  id: makeId("criterion"),
                  name: "",
                  evaluates: "",
                  marks: question.marks,
                  keyPoints: "",
                  fullCredit: "",
                  partialCredit: "",
                  noCredit: ""
                }

              ]

              : [];

          return question;

        }
      )

    });

  }

  /* =========================================
     REGENERATE QUESTION - MOCK AI
  ========================================= */

  async function regenerateQuestion(
    question,
    assessment,
    sourceMaterials
  ) {

    await delay();

    if (!sourceMaterials?.length) {

      fail(
        "Select at least one lecture before regenerating."
      );

    }

    const replacement = makeQuestion(
      question.type,
      0,
      "ai"
    );

    replacement.text =
      "Simulated replacement prompt — review and edit before use.";

    replacement.topic =
      "Generated sample — verify";

    replacement.difficulty =
      assessment.difficulty || "Medium";

    replacement.marks =
      Number(question.marks) || 1;

    replacement.options =
      replacement.options.map(
        (option, index) => ({

          ...option,

          text:
            `Replacement sample option ${index + 1} — edit`

        })
      );

    replacement.rubric =

      question.type === "essay"

        ? [

          {
            ...replacement.rubric[0],
            marks: replacement.marks
          }

        ]

        : [];

    return response(replacement);

  }

  /* =========================================
     TEACHER - GET SAVED ASSESSMENTS
  ========================================= */

  async function getSavedAssessments() {

    await delay();

    const list = readList(
      config.assessmentStorageKey
    );

    list.sort(
      (a, b) =>
        b.updatedAt.localeCompare(a.updatedAt)
    );

    return response(list);

  }

  /* =========================================
     GET ASSESSMENT BY ID
  ========================================= */

  async function getAssessmentById(id) {

    await delay();

    const assessment = readList(
      config.assessmentStorageKey
    ).find(
      item => item.id === id
    );

    if (!assessment) {

      fail("Assessment not found.");

    }

    return response(assessment);

  }

  /* =========================================
     TEACHER - SAVE DRAFT
  ========================================= */

  async function saveDraft(assessment) {

    await delay();

    if (
      !assessment ||
      typeof assessment !== "object"
    ) {

      fail(
        "Assessment data is required."
      );

    }

    const list = readList(
      config.assessmentStorageKey
    );

    const existing = list.find(
      item => item.id === assessment.id
    );

    if (existing?.status === "published") {

      fail(
        "Published assessments are read-only. Duplicate it to make changes."
      );

    }

    const timestamp = now();

    const saved = {

      ...clone(assessment),

      id:
        assessment.id ||
        makeId("assessment"),

      status: "draft",

      createdAt:
        existing?.createdAt ||
        assessment.createdAt ||
        timestamp,

      updatedAt: timestamp

    };

    const index = list.findIndex(
      item => item.id === saved.id
    );

    if (index >= 0) {

      list[index] = saved;

    } else {

      list.push(saved);

    }

    writeList(
      config.assessmentStorageKey,
      list
    );

    return response(saved);

  }

  /* =========================================
     TEACHER - PUBLISH ASSESSMENT
  ========================================= */

  async function publishAssessment(assessment) {

    await delay();

    const errors = validatePublish(
      assessment
    );

    if (errors.length) {

      fail(
        errors.join("\n")
      );

    }

    const list = readList(
      config.assessmentStorageKey
    );

    const existing = list.find(
      item => item.id === assessment.id
    );

    if (existing?.status === "published") {

      fail(
        "This assessment has already been published."
      );

    }

    const timestamp = now();

    const published = {

      ...clone(assessment),

      id:
        assessment.id ||
        makeId("assessment"),

      status: "published",

      simulatedPublish: true,

      createdAt:
        existing?.createdAt ||
        assessment.createdAt ||
        timestamp,

      updatedAt: timestamp

    };

    const index = list.findIndex(
      item => item.id === published.id
    );

    if (index >= 0) {

      list[index] = published;

    } else {

      list.push(published);

    }

    writeList(
      config.assessmentStorageKey,
      list
    );

    return response(published);

  }

  /* =========================================
     TEACHER - DUPLICATE ASSESSMENT
  ========================================= */

  async function duplicateAssessment(id) {

    await delay();

    const list = readList(
      config.assessmentStorageKey
    );

    const source = list.find(
      item => item.id === id
    );

    if (!source) {

      fail("Assessment not found.");

    }

    const timestamp = now();

    const duplicate = {

      ...clone(source),

      id: makeId("assessment"),

      title:
        `${source.title || "Untitled assessment"} (Copy)`,

      status: "draft",

      simulatedPublish: false,

      createdAt: timestamp,

      updatedAt: timestamp,

      questions: (
        source.questions || []
      ).map(question => ({

        ...question,

        id: makeId("question"),

        options: (
          question.options || []
        ).map(option => ({

          ...option,

          id: makeId("option")

        })),

        rubric: (
          question.rubric || []
        ).map(criterion => ({

          ...criterion,

          id: makeId("criterion")

        }))

      }))

    };

    list.push(duplicate);

    writeList(
      config.assessmentStorageKey,
      list
    );

    return response(duplicate);

  }

  /* =========================================
     TEACHER - DELETE ASSESSMENT
  ========================================= */

  async function deleteAssessment(id) {

    await delay();

    const list = readList(
      config.assessmentStorageKey
    );

    const remaining = list.filter(
      item => item.id !== id
    );

    if (remaining.length === list.length) {

      fail("Assessment not found.");

    }

    writeList(
      config.assessmentStorageKey,
      remaining
    );

    return response({

      id,

      deleted: true

    });

  }

  /* =========================================
     STUDENT ASSESSMENT API
  ========================================= */

  /* =========================================
     GET PUBLISHED ASSESSMENTS
  ========================================= */

  async function getPublishedAssessments() {

    await delay();

    const list = readList(
      config.assessmentStorageKey
    );

    const published = list.filter(
      assessment =>
        assessment.status === "published"
    );

    return response(

      published.map(assessment => ({

        id: assessment.id,

        title: assessment.title,

        courseId: assessment.courseId,

        courseName: courses.find(

          course =>
            course.id === assessment.courseId

        )?.name || "Course",

        duration_min:
          assessment.duration_min,

        pass_marks:
          assessment.pass_marks,

        max_attempt:
          assessment.max_attempt,

        shuffle_question:
          assessment.shuffle_question,

        shuffle_option:
          assessment.shuffle_option,

        start_date_time:
          assessment.start_date_time,

        questionCount:
          (assessment.questions || []).length,

        totalMarks: roundMarks(

          (assessment.questions || []).reduce(

            (sum, question) =>
              sum + Number(question.marks || 0),

            0

          )

        )

      }))

    );

  }

  /* =========================================
     GRADE STUDENT ATTEMPT
  ========================================= */

  function gradeAttempt(attempt) {

    attempt.results = attempt.questions.map(
      question => {

        const answer = String(
          attempt.answers[question.id] || ""
        );

        const key =
          attempt.gradingKeys[question.id];

        const maxMarks =
          Number(question.marks);

        /* UNANSWERED QUESTION */

        if (!answer.trim()) {

          return {

            questionId: question.id,

            maxMarks,

            marks: 0,

            status: "incorrect",

            feedback: [
              "You did not answer this question."
            ]

          };

        }

        /* MCQ AUTOMATIC GRADING */

        if (question.type === "mcq") {

          const correct =
            answer === key.correctOptionId;

          if (correct) {

            return {

              questionId: question.id,

              maxMarks,

              marks: maxMarks,

              status: "correct",

              feedback: []

            };

          }

          return {

            questionId: question.id,

            maxMarks,

            marks: 0,

            status: "incorrect",

            feedback: [

              `The correct answer is: ${key.correctAnswer}`,

              ...(key.explanation
                ? [key.explanation]
                : [])

            ]

          };

        }

        /* =====================================
           ESSAY GRADING

           Real AI grading requires a backend.

           Model answers and rubric criteria
           are preserved for future integration.

           No fake semantic grading is performed.
        ===================================== */

        return {

          questionId: question.id,

          maxMarks,

          marks: null,

          status: "pending",

          feedback: [

            attempt.gradingMethod === "ai"
              ? "AI grading is awaiting processing."
              : "Your essay answer is awaiting teacher grading."

          ]

        };

      }
    );

    /* TOTAL EARNED MARKS */

    attempt.earnedMarks = roundMarks(

      attempt.results.reduce(

        (sum, result) =>
          sum + (result.marks ?? 0),

        0

      )

    );

    /* OVERALL GRADING STATUS */

    attempt.gradingStatus =

      attempt.results.some(
        result => result.status === "pending"
      )

        ? "pending"

        : "graded";

    attempt.status = "submitted";

    attempt.submittedAt = Date.now();

  }

  /* =========================================
     READ STUDENT ATTEMPTS

     Expired attempts are automatically
     submitted when storage is accessed.
  ========================================= */

  function readStudentAttempts() {

    const attempts = readList(
      config.studentAttemptStorageKey
    );

    let changed = false;

    attempts.forEach(attempt => {

      if (
        attempt.status === "in-progress" &&
        Date.now() >= attempt.expiresAt
      ) {

        gradeAttempt(attempt);

        changed = true;

      }

    });

    if (changed) {

      writeList(

        config.studentAttemptStorageKey,

        attempts

      );

    }

    return attempts;

  }

  /* =========================================
     STUDENT SAFE RESPONSE

     Do not return grading keys to the
     student assessment player.

     LocalStorage is still mock storage,
     not a secure server-side database.
  ========================================= */

  function publicAttempt(attempt) {

    const {

      gradingKeys,

      ...studentData

    } = attempt;

    return studentData;

  }

  /* =========================================
     GET STUDENT ATTEMPTS
  ========================================= */

  async function getStudentAttempts(
    assessmentId
  ) {

    await delay();

    const attempts = readStudentAttempts();

    const filtered = attempts.filter(
      attempt =>

        !assessmentId ||

        attempt.assessmentId === assessmentId
    );

    return response(
      filtered.map(publicAttempt)
    );

  }

  /* =========================================
     START STUDENT ASSESSMENT
  ========================================= */

  async function startStudentAssessment(
    assessmentId
  ) {

    await delay();

    const attempts = readStudentAttempts();

    /* PREVIOUS ATTEMPTS */

    const previousAttempts = attempts.filter(

      attempt =>
        attempt.assessmentId === assessmentId

    );

    /* RESUME EXISTING ATTEMPT */

    const activeAttempt = previousAttempts.find(

      attempt =>
        attempt.status === "in-progress"

    );

    if (activeAttempt) {

      return response(
        publicAttempt(activeAttempt)
      );

    }

    /* FIND PUBLISHED ASSESSMENT */

    const assessment = readList(

      config.assessmentStorageKey

    ).find(

      item =>

        item.id === assessmentId &&

        item.status === "published"

    );

    if (!assessment) {

      fail(
        "This assessment is not available."
      );

    }

    /* VALIDATE START DATE */

    const startDate = Date.parse(
      assessment.start_date_time
    );

    if (
      !Number.isFinite(startDate) ||
      startDate > Date.now()
    ) {

      fail(
        "This assessment is not available yet."
      );

    }

    /* VALIDATE MAXIMUM ATTEMPTS */

    const maxAttempts =
      Number(assessment.max_attempt) || 1;

    if (
      previousAttempts.length >= maxAttempts
    ) {

      fail(
        "No attempts remaining."
      );

    }

    /* VALIDATE DURATION */

    const duration = Number(
      assessment.duration_min
    );

    if (
      !Number.isFinite(duration) ||
      duration <= 0
    ) {

      fail(
        "Invalid assessment duration."
      );

    }

    /* =====================================
       PREPARE QUESTIONS AND GRADING KEYS
    ===================================== */

    const gradingKeys = {};

    let questions = (
      assessment.questions || []
    ).map(question => {

      /* STORE ORIGINAL CORRECT OPTION */

      const correctOption =

        question.options?.[
        question.correctIndex
        ];

      gradingKeys[question.id] = {

        correctOptionId:
          correctOption?.id,

        correctAnswer:
          correctOption?.text || "",

        explanation:
          question.explanation || "",

        modelAnswer:
          question.modelAnswer || "",

        rubric:
          clone(question.rubric || [])

      };

      /* STUDENT OPTIONS */

      let options = (
        question.options || []
      ).filter(

        option => option.text?.trim()

      ).map(option => ({

        id: option.id,

        text: option.text

      }));

      /* SHUFFLE OPTIONS */

      if (assessment.shuffle_option) {

        options = shuffle(options);

      }

      /* STUDENT QUESTION */

      return {

        id: question.id,

        type: question.type,

        text: question.text,

        image: question.image || "",

        marks: Number(question.marks),

        options

      };

    });

    if (!questions.length) {

      fail(
        "This assessment has no questions."
      );

    }

    /* SHUFFLE QUESTIONS */

    if (assessment.shuffle_question) {

      questions = shuffle(questions);

    }

    /* =====================================
       CREATE ATTEMPT
    ===================================== */

    const startedAt = Date.now();

    const expiresAt =

      startedAt + duration * 60 * 1000;

    const attempt = {
      gradingMethod: assessment.gradingMethod || "manual",

      id: makeId("attempt"),

      assessmentId: assessment.id,

      title: assessment.title,

      courseId: assessment.courseId,

      courseName: courses.find(

        course =>
          course.id === assessment.courseId

      )?.name || "Course",

      attemptNumber:
        previousAttempts.length + 1,

      status: "in-progress",

      startedAt,

      expiresAt,

      questions,

      gradingKeys,

      answers: {},

      currentIndex: 0,

      totalMarks: roundMarks(

        questions.reduce(

          (sum, question) =>
            sum + Number(question.marks),

          0

        )

      ),

      passMarks:
        Number(assessment.pass_marks)

    };

    /* SAVE ATTEMPT */

    attempts.push(attempt);

    writeList(

      config.studentAttemptStorageKey,

      attempts

    );

    return response(
      publicAttempt(attempt)
    );

  }

  /* =========================================
     SAVE STUDENT ANSWER
  ========================================= */

  function saveStudentAnswer(
    attemptId,
    questionId,
    answer
  ) {

    const attempts = readStudentAttempts();

    const attempt = attempts.find(

      item => item.id === attemptId

    );

    if (
      !attempt ||
      attempt.status !== "in-progress"
    ) {

      fail(
        "Attempt is no longer active."
      );

    }

    /* FIND QUESTION */

    const question = attempt.questions.find(

      item => item.id === questionId

    );

    if (!question) {

      fail(
        "Question not found."
      );

    }

    /* VALIDATE MCQ OPTION */

    if (

      question.type === "mcq" &&

      !question.options.some(

        option => option.id === answer

      )

    ) {

      fail(
        "Invalid answer option."
      );

    }

    /* SAVE ANSWER */

    attempt.answers[questionId] =

      String(answer ?? "");

    writeList(

      config.studentAttemptStorageKey,

      attempts

    );

    return response(
      publicAttempt(attempt)
    );

  }

  /* =========================================
     SAVE STUDENT QUESTION POSITION
  ========================================= */

  function saveStudentPosition(
    attemptId,
    index
  ) {

    const attempts = readStudentAttempts();

    const attempt = attempts.find(

      item => item.id === attemptId

    );

    if (
      !attempt ||
      attempt.status !== "in-progress"
    ) {

      fail(
        "Attempt is no longer active."
      );

    }

    if (

      Number.isInteger(index) &&

      index >= 0 &&

      index < attempt.questions.length

    ) {

      attempt.currentIndex = index;

    }

    writeList(

      config.studentAttemptStorageKey,

      attempts

    );

    return response(
      publicAttempt(attempt)
    );

  }

  /* =========================================
     SUBMIT STUDENT ASSESSMENT
  ========================================= */

  async function submitStudentAssessment(
    attemptId
  ) {

    await delay();

    const attempts = readStudentAttempts();

    const attempt = attempts.find(

      item => item.id === attemptId

    );

    if (!attempt) {

      fail(
        "Attempt not found."
      );

    }

    /* PREVENT DUPLICATE SUBMISSION */

    if (attempt.status === "submitted") {

      return response(
        publicAttempt(attempt)
      );

    }

    /* GRADE ATTEMPT */

    gradeAttempt(attempt);

    /* SAVE RESULTS */

    writeList(

      config.studentAttemptStorageKey,

      attempts

    );

    return response(
      publicAttempt(attempt)
    );

  }


  /* =========================================
     TEACHER - ASSESSMENT SUBMISSIONS
  ========================================= */

  async function getTeacherSubmissions(assessmentId) {

    await delay();

    const attempts = readStudentAttempts();

    const submissions = attempts.filter(
      attempt =>
        attempt.assessmentId === assessmentId &&
        attempt.status === "submitted"
    );

    submissions.sort(
      (a, b) => b.submittedAt - a.submittedAt
    );

    return response(submissions);

  }


  /* =========================================
     TEACHER - PUBLISH ESSAY GRADES
  ========================================= */

  async function publishEssayGrades(
    attemptId,
    essayGrades
  ) {

    await delay();

    const attempts = readStudentAttempts();

    const attempt = attempts.find(
      item => item.id === attemptId
    );

    if (!attempt) {

      fail("Student submission not found.");

    }
    
    if (attempt.gradingMethod === "ai") {

      fail(
        "This assessment uses AI grading."
      );

    }

    if (attempt.status !== "submitted") {

      fail("This assessment has not been submitted.");

    }

    if (attempt.gradingStatus === "graded") {

      fail("Results have already been published.");

    }

    if (!Array.isArray(essayGrades)) {

      fail("Essay grades are required.");

    }

    const pendingResults = attempt.results.filter(
      result => result.status === "pending"
    );

    if (essayGrades.length !== pendingResults.length) {

      fail("Grade every pending essay before publishing.");

    }

    pendingResults.forEach(result => {

      const question = attempt.questions.find(
        item => item.id === result.questionId
      );

      if (!question || question.type !== "essay") {

        fail("Invalid essay question.");

      }

      const grade = essayGrades.find(
        item => item.questionId === question.id
      );

      if (!grade) {

        fail("A question has not been graded.");

      }

      const rubric =
        attempt.gradingKeys[question.id]?.rubric || [];

      if (!rubric.length) {

        fail("This question has no grading rubric.");

      }

      if (
        !Array.isArray(grade.criteria) ||
        grade.criteria.length !== rubric.length
      ) {

        fail("Grade every rubric criterion.");

      }

      let earnedMarks = 0;

      const feedback = [];

      const rubricResults = rubric.map(criterion => {

        const evaluation = grade.criteria.find(
          item => item.criterionId === criterion.id
        );

        if (
          !evaluation ||
          evaluation.marks === "" ||
          evaluation.marks == null
        ) {

          fail(`Enter marks for ${criterion.name}.`);

        }

        const marks = Number(evaluation.marks);

        const maxMarks = Number(criterion.marks);

        if (
          !Number.isFinite(marks) ||
          marks < 0 ||
          marks > maxMarks
        ) {

          fail(
            `${criterion.name}: marks must be between 0 and ${maxMarks}.`
          );

        }

        const reason = String(
          evaluation.feedback || ""
        ).trim();

        const deductedMarks = roundMarks(
          maxMarks - marks
        );

        if (deductedMarks > 0 && !reason) {

          fail(
            `Explain the deducted marks for ${criterion.name}.`
          );

        }

        earnedMarks += marks;

        if (deductedMarks > 0) {

          feedback.push(
            `${criterion.name}: ${marks}/${maxMarks} marks. ` +
            `Deducted ${deductedMarks} mark(s). ${reason}`
          );

        }

        return {

          criterionId: criterion.id,

          name: criterion.name,

          marks,

          maxMarks,

          deductedMarks,

          feedback: reason

        };

      });

      earnedMarks = roundMarks(earnedMarks);

      const maxMarks = Number(question.marks);

      if (earnedMarks > maxMarks + 0.000001) {

        fail("Question score exceeds maximum marks.");

      }

      const isCorrect =
        Math.abs(earnedMarks - maxMarks) < 0.000001;

      const teacherFeedback = String(
        grade.feedback || ""
      ).trim();

      if (!isCorrect && teacherFeedback) {

        feedback.push(teacherFeedback);

      }

      result.marks = earnedMarks;

      result.status = isCorrect
        ? "correct"
        : earnedMarks > 0
          ? "partial"
          : "incorrect";

      result.feedback = isCorrect
        ? []
        : feedback;

      result.rubricResults = rubricResults;

    });

    /* Recalculate final assessment score */

    attempt.earnedMarks = roundMarks(

      attempt.results.reduce(
        (sum, result) =>
          sum + Number(result.marks || 0),
        0
      )

    );

    attempt.gradingStatus = "graded";

    attempt.gradedAt = Date.now();

    attempt.resultsPublishedAt = Date.now();

    writeList(
      config.studentAttemptStorageKey,
      attempts
    );

    return response(
      publicAttempt(attempt)
    );

  }


  /* =========================================
     EXPOSE API METHODS
  ========================================= */

  window.eduApi = Object.freeze({

    assessment: Object.freeze({

      /* CONFIGURATION */

      config,

      /* COURSES AND LECTURES */

      getCourses,

      getAvailableLectures,

      uploadLectureMaterial,

      /* TEACHER QUESTION GENERATION */

      extractAssessmentQuestions,

      generateAssessmentQuestions,

      regenerateQuestion,

      /* TEACHER ASSESSMENTS */

      getSavedAssessments,

      getAssessmentById,

      saveDraft,

      publishAssessment,

      duplicateAssessment,

      deleteAssessment,

      /* VALIDATION */

      validateQuestion,

      validatePublish,

      /* STUDENT ASSESSMENTS */

      getPublishedAssessments,

      getStudentAttempts,

      startStudentAssessment,

      saveStudentAnswer,

      saveStudentPosition,

      submitStudentAssessment,

      getTeacherSubmissions,

      publishEssayGrades

    })

  });

})();
