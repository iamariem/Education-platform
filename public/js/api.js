/* Centralized mock API. Replace these methods with HTTP calls when contracts exist. */
(() => {
  "use strict";

  const config = Object.freeze({
    assessmentStorageKey: "edusaas.assessments.v1",
    lectureStorageKey: "edusaas.assessment-lecture-materials.v1",
    supportedAssessmentFormats: ["pdf", "docx"],
    supportedLectureFormats: ["pdf", "pptx", "docx", "txt"],
    maxAiQuestions: 10,
    latencyMs: 180
  });

  const courses = [
    { id: "course-neural-networks", name: "Neural Networks" },
    { id: "course-operating-systems", name: "Operating Systems" },
    { id: "course-data-structures", name: "Data Structures" }
  ];

  const lectures = [
    { id: "lecture-nn-1", courseId: courses[0].id, title: "Neural Network Fundamentals" },
    { id: "lecture-nn-2", courseId: courses[0].id, title: "Training and Optimization" },
    { id: "lecture-os-1", courseId: courses[1].id, title: "Processes and Scheduling" },
    { id: "lecture-os-2", courseId: courses[1].id, title: "Memory Management" },
    { id: "lecture-ds-1", courseId: courses[2].id, title: "Trees and Graphs" }
  ];

  const delay = () => new Promise((resolve) => setTimeout(resolve, config.latencyMs));
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const makeId = (prefix) => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
  const now = () => new Date().toISOString();
  const response = (data) => ({ data: clone(data), error: null });
  const fail = (message) => {
    const error = new Error(message);
    error.name = "AssessmentApiError";
    throw error;
  };
  const extensionOf = (name = "") => name.split(".").pop().toLowerCase();

  function readList(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (error) {
      console.error(`Unable to read mock API data at "${key}".`, error);
      return [];
    }
  }

  function writeList(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      fail(`Could not persist mock assessment data: ${error.message}`);
    }
  }

  function validateQuestion(question, index) {
    const label = `Question ${index + 1}`;
    const errors = [];
    if (!question.text?.trim()) errors.push(`${label}: question text is required.`);
    if (!Number.isFinite(Number(question.marks)) || Number(question.marks) <= 0) {
      errors.push(`${label}: marks must be greater than zero.`);
    }
    if (question.type === "mcq") {
      const options = (question.options || []).filter((option) => option.text?.trim());
      if (options.length < 2) errors.push(`${label}: add at least two non-empty options.`);
      if (!Number.isInteger(question.correctIndex) ||
        !question.options?.[question.correctIndex]?.text?.trim()) {
        errors.push(`${label}: select exactly one correct answer.`);
      }
    }
    if (question.type === "essay") {
      const rubricTotal = (question.rubric || []).reduce(
        (sum, criterion) => sum + Number(criterion.marks || 0), 0
      );
      if (!question.modelAnswer?.trim()) errors.push(`${label}: add a teacher-only model answer.`);
      if (!question.rubric?.length) errors.push(`${label}: add at least one rubric criterion.`);
      if (Math.abs(rubricTotal - Number(question.marks)) > 0.001) {
        errors.push(`${label}: rubric marks (${rubricTotal}) must equal question marks (${question.marks}).`);
      }
      (question.rubric || []).forEach((criterion, criterionIndex) => {
        const criterionLabel = `${label}, rubric criterion ${criterionIndex + 1}`;
        if (!criterion.name?.trim()) errors.push(`${criterionLabel}: name is required.`);
        if (!criterion.evaluates?.trim()) errors.push(`${criterionLabel}: evaluation description is required.`);
        if (!Number.isFinite(Number(criterion.marks)) || Number(criterion.marks) <= 0) {
          errors.push(`${criterionLabel}: marks must be greater than zero.`);
        }
        if (!criterion.fullCredit?.trim() || !criterion.partialCredit?.trim() ||
          !criterion.noCredit?.trim()) {
          errors.push(`${criterionLabel}: complete full, partial, and no-credit descriptions.`);
        }
      });
    }
    return errors;
  }

  function validatePublish(assessment) {
    const errors = [];
    const duration = Number(assessment.duration_min);
    const passMarks = Number(assessment.pass_marks);
    const maxAttempts = Number(assessment.max_attempt);

    const totalMarks = (assessment.questions || []).reduce(
      (sum, question) => sum + Number(question.marks || 0),
      0
    );

    if (!Number.isInteger(duration) || duration < 1) {
      errors.push("Duration must be at least 1 minute.");
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

    if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
      errors.push("Maximum attempts must be at least 1.");
    }

    if (
      !assessment.start_date_time ||
      Number.isNaN(Date.parse(assessment.start_date_time))
    ) {
      errors.push("Select a valid start date and time.");
    }
    if (!assessment.title?.trim()) errors.push("Assessment title is required.");
    if (!courses.some((course) => course.id === assessment.courseId)) {
      errors.push("Select a valid course.");
    }
    if (!assessment.questions?.length) errors.push("Add at least one question.");
    assessment.questions?.forEach((question, index) => {
      errors.push(...validateQuestion(question, index));
    });
    return errors;
  }

  function makeQuestion(type, index, origin) {
    const id = makeId("question");
    const marks = 1;
    return {
      id,
      type,
      text: "",
      topic: "",
      difficulty: "Medium",
      marks,
      options: type === "mcq"
        ? ["", "", "", ""].map((text) => ({ id: makeId("option"), text }))
        : [],
      correctIndex: null,
      explanation: "",
      modelAnswer: "",
      rubric: type === "essay"
        ? [{
          id: makeId("criterion"),
          name: "",
          evaluates: "",
          marks,
          keyPoints: "",
          fullCredit: "",
          partialCredit: "",
          noCredit: ""
        }]
        : [],
      origin,
      needsReview: origin === "import" || origin === "ai"
    };
  }

  async function getCourses() {
    await delay();
    return response(courses);
  }

  async function getAvailableLectures(courseId) {
    await delay();
    return response(courseId ? lectures.filter((lecture) => lecture.courseId === courseId) : lectures);
  }

  async function uploadLectureMaterial(fileMetadata, courseId) {
    await delay();
    const extension = extensionOf(fileMetadata?.name);
    if (!config.supportedLectureFormats.includes(extension)) {
      fail(`Unsupported lecture material format. Use: ${config.supportedLectureFormats.join(", ").toUpperCase()}.`);
    }
    if (!fileMetadata?.name || !Number(fileMetadata.size)) fail("Choose a non-empty lecture material file.");
    const material = {
      id: makeId("material"),
      name: fileMetadata.name,
      size: Number(fileMetadata.size),
      format: extension,
      courseId: courseId || null,
      createdAt: now(),
      simulated: true
    };
    const materials = readList(config.lectureStorageKey);
    materials.push(material);
    writeList(config.lectureStorageKey, materials);
    return response(material);
  }

  async function extractAssessmentQuestions(fileMetadata, settings = {}) {
    await delay();
    const extension = extensionOf(fileMetadata?.name);
    if (!config.supportedAssessmentFormats.includes(extension)) {
      fail(`Unsupported assessment format. Use: ${config.supportedAssessmentFormats.join(", ").toUpperCase()}.`);
    }
    if (!fileMetadata?.name || !Number(fileMetadata.size)) fail("Choose a non-empty assessment file.");
    const count = Math.max(1, Math.min(5, Number(settings.questionCount) || 2));
    return response({
      simulated: true,
      message: "Mock extraction only: these editable sample prompts were not read from the uploaded file.",
      questions: Array.from({ length: count }, (_, index) => {
        const question = makeQuestion(index % 2 === 0 ? "mcq" : "essay", index, "import");
        question.text = `Mock extracted sample question ${index + 1} — replace with content reviewed from your document.`;
        question.topic = "Teacher review required";
        question.needsReview = true;
        return question;
      })
    });
  }

  async function generateAssessmentQuestions(assessment, sourceMaterials) {
    await delay();
    const count = assessment.questions?.length ||
      (assessment.questionType === "mixed"
        ? Number(assessment.mcqCount || 0) + Number(assessment.essayCount || 0)
        : Number(assessment.questionCount || 0));
    if (!sourceMaterials?.length) {
      fail("Select at least one lecture from your course.");
    }
    if (count < 1) fail("Generate at least one question.");
    if (count > config.maxAiQuestions) fail(`AI generation is limited to ${config.maxAiQuestions} questions total.`);
    const types = assessment.questionType === "mixed"
      ? [
        ...Array(Number(assessment.mcqCount) || 0).fill("mcq"),
        ...Array(Number(assessment.essayCount) || 0).fill("essay")
      ]
      : Array(count).fill(assessment.questionType === "essay" ? "essay" : "mcq");
    return response({
      simulated: true,
      message: "Simulated AI output. Review and edit every question before use.",
      questions: types.map((type, index) => {
        const question = makeQuestion(type, index, "ai");
        question.text = `Simulated ${type === "mcq" ? "multiple-choice" : "essay"} question ${index + 1} — review and replace this sample prompt.`;
        question.topic = "Generated sample — verify";
        question.difficulty = assessment.difficulty || "Medium";
        question.marks = Number(type === "mcq" ? assessment.mcqMarks : assessment.essayMarks) || 1;
        question.options = question.options.map((option, optionIndex) => ({
          ...option,
          text: `Sample option ${optionIndex + 1} — edit`
        }));
        question.rubric = type === "essay" ? [{
          id: makeId("criterion"),
          name: "",
          evaluates: "",
          marks: question.marks,
          keyPoints: "",
          fullCredit: "",
          partialCredit: "",
          noCredit: ""
        }] : [];
        return question;
      })
    });
  }

  async function regenerateQuestion(question, assessment, sourceMaterials) {
    await delay();
    if (!sourceMaterials?.length) {
      fail("Select at least one lecture before regenerating.");
    }
    const replacement = makeQuestion(question.type, 0, "ai");
    replacement.text = "Simulated replacement prompt — review and edit before use.";
    replacement.topic = "Generated sample — verify";
    replacement.difficulty = assessment.difficulty || "Medium";
    replacement.marks = Number(question.marks) || 1;
    replacement.options = replacement.options.map((option, index) => ({
      ...option,
      text: `Replacement sample option ${index + 1} — edit`
    }));
    replacement.rubric = question.type === "essay"
      ? [{ ...replacement.rubric[0], marks: replacement.marks }]
      : [];
    return response(replacement);
  }

  async function getSavedAssessments() {
    await delay();
    return response(readList(config.assessmentStorageKey).sort(
      (a, b) => b.updatedAt.localeCompare(a.updatedAt)
    ));
  }

  async function getAssessmentById(id) {
    await delay();
    const assessment = readList(config.assessmentStorageKey).find((item) => item.id === id);
    if (!assessment) fail("Assessment not found.");
    return response(assessment);
  }

  async function saveDraft(assessment) {
    await delay();
    if (!assessment || typeof assessment !== "object") fail("Assessment data is required.");
    const list = readList(config.assessmentStorageKey);
    const existing = list.find((item) => item.id === assessment.id);
    if (existing?.status === "published") fail("Published assessments are read-only. Duplicate it to make changes.");
    const timestamp = now();
    const saved = {
      ...clone(assessment),
      id: assessment.id || makeId("assessment"),
      status: "draft",
      createdAt: existing?.createdAt || assessment.createdAt || timestamp,
      updatedAt: timestamp
    };
    const index = list.findIndex((item) => item.id === saved.id);
    if (index >= 0) list[index] = saved;
    else list.push(saved);
    writeList(config.assessmentStorageKey, list);
    return response(saved);
  }

  async function publishAssessment(assessment) {
    await delay();
    const errors = validatePublish(assessment);
    if (errors.length) fail(errors.join("\n"));
    const list = readList(config.assessmentStorageKey);
    const existing = list.find((item) => item.id === assessment.id);
    if (existing?.status === "published") fail("This assessment has already been published.");
    const timestamp = now();
    const published = {
      ...clone(assessment),
      id: assessment.id || makeId("assessment"),
      status: "published",
      simulatedPublish: true,
      createdAt: existing?.createdAt || assessment.createdAt || timestamp,
      updatedAt: timestamp
    };
    const index = list.findIndex((item) => item.id === published.id);
    if (index >= 0) list[index] = published;
    else list.push(published);
    writeList(config.assessmentStorageKey, list);
    return response(published);
  }

  async function duplicateAssessment(id) {
    await delay();
    const list = readList(config.assessmentStorageKey);
    const source = list.find((item) => item.id === id);
    if (!source) fail("Assessment not found.");
    const timestamp = now();
    const duplicate = {
      ...clone(source),
      id: makeId("assessment"),
      title: `${source.title || "Untitled assessment"} (Copy)`,
      status: "draft",
      simulatedPublish: false,
      createdAt: timestamp,
      updatedAt: timestamp,
      questions: (source.questions || []).map((question) => ({
        ...question,
        id: makeId("question"),
        options: (question.options || []).map((option) => ({ ...option, id: makeId("option") })),
        rubric: (question.rubric || []).map((criterion) => ({ ...criterion, id: makeId("criterion") }))
      }))
    };
    list.push(duplicate);
    writeList(config.assessmentStorageKey, list);
    return response(duplicate);
  }

  async function deleteAssessment(id) {
    await delay();
    const list = readList(config.assessmentStorageKey);
    const remaining = list.filter((item) => item.id !== id);
    if (remaining.length === list.length) fail("Assessment not found.");
    writeList(config.assessmentStorageKey, remaining);
    return response({ id, deleted: true });
  }

  window.eduApi = Object.freeze({
    assessment: Object.freeze({
      config,
      getCourses,
      getAvailableLectures,
      uploadLectureMaterial,
      extractAssessmentQuestions,
      generateAssessmentQuestions,
      regenerateQuestion,
      getSavedAssessments,
      getAssessmentById,
      saveDraft,
      publishAssessment,
      duplicateAssessment,
      deleteAssessment,
      validateQuestion,
      validatePublish
    })
  });
})();