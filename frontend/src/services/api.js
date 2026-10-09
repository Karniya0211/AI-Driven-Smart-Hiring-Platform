const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

async function requestJson(url, options = {}) {
  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.headers || {})
      }
    });
  } catch (error) {
    throw new Error("Unable to connect to the authentication server.");
  }

  const contentType = res.headers.get("content-type") || "";
  let payload = {};

  if (contentType.includes("application/json")) {
    payload = await res.json();
  } else {
    const text = await res.text();
    payload = text
      ? { error: text }
      : { error: "The server returned an empty response. Make sure the backend is running." };
  }

  if (!res.ok) {
    throw new Error(payload.error || `Request failed with status ${res.status}`);
  }

  return payload;
}

function getAuthHeaders() {
  const token = localStorage.getItem("ai_matcher_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };
}

export const api = {
  // Auth
  async login(email, password) {
    return requestJson(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
  },

  async register(email, password, full_name, role) {
    return requestJson(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, full_name, role })
    });
  },

  async getMe() {
    return requestJson(`${API_BASE}/api/auth/me`, {
      headers: getAuthHeaders()
    });
  },

  // User Saved Constraints
  async getUserConstraints() {
    return requestJson(`${API_BASE}/api/user/constraints`, {
      headers: getAuthHeaders()
    });
  },

  async updateUserConstraints(constraints) {
    return requestJson(`${API_BASE}/api/user/constraints`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ constraints })
    });
  },

  // User Saved State (for persisting all results, selected jobs, and inputs)
  async getUserSavedState() {
    return requestJson(`${API_BASE}/api/user/saved-state`, {
      headers: getAuthHeaders()
    });
  },

  async updateUserSavedState(savedState) {
    return requestJson(`${API_BASE}/api/user/saved-state`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ saved_state: savedState })
    });
  },

  // Sample Resumes
  async getSampleResumes() {
    return requestJson(`${API_BASE}/api/sample-resumes`);
  },

  // Candidate Profile & Upload
  async getCandidateProfile() {
    return requestJson(`${API_BASE}/api/candidate/profile`, {
      headers: getAuthHeaders()
    });
  },

  async uploadResume(formDataOrText, isFile = false) {
    const token = localStorage.getItem("ai_matcher_token");
    let options = {};

    if (isFile) {
      options = {
        method: "POST",
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: formDataOrText
      };
    } else {
      options = {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(formDataOrText)
      };
    }

    return requestJson(`${API_BASE}/api/resume/upload`, options);
  },

  // 3-Model Pipeline
  async runPipeline(jobId, resumeText) {
    return requestJson(`${API_BASE}/api/pipeline/run`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ job_id: jobId, resume_text: resumeText })
    });
  },

  // Jobs
  async getJobs() {
    return requestJson(`${API_BASE}/api/jobs`);
  },

  async getJobDetail(jobId) {
    return requestJson(`${API_BASE}/api/jobs/${jobId}`);
  },

  async createJob(jobData) {
    return requestJson(`${API_BASE}/api/jobs`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(jobData)
    });
  },

  // Recruiter Dashboard
  async matchCandidatesForJob(jobId) {
    return requestJson(`${API_BASE}/api/jobs/${jobId}/match-candidates`, {
      headers: getAuthHeaders()
    });
  },

  async getRecruiterAnalytics() {
    return requestJson(`${API_BASE}/api/recruiter/analytics`, {
      headers: getAuthHeaders()
    });
  },

  async generateInterviewQuestions(jobRole, categories, count) {
    return requestJson(`${API_BASE}/api/interviews/questions`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ job_role: jobRole, categories, count })
    });
  },

  async startInterviewSession(data) {
    return requestJson(`${API_BASE}/api/interviews/sessions`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
  },

  async getInterviewSessions() {
    return requestJson(`${API_BASE}/api/interviews/sessions`, { headers: getAuthHeaders() });
  },

  async submitInterviewResponse(sessionId, data) {
    return requestJson(`${API_BASE}/api/interviews/sessions/${sessionId}/responses`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
  },

  async updateAtsCandidateStatus(candidateId, status) {
    return requestJson(`${API_BASE}/api/ats/candidates/${candidateId}/status`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
  },

  async getInterviewSession(sessionId) {
    return requestJson(`${API_BASE}/api/interviews/sessions/${sessionId}`, {
      headers: getAuthHeaders()
    });
  },

  async downloadInterviewReport(sessionId) {
    const token = localStorage.getItem("ai_matcher_token");
    const response = await fetch(`${API_BASE}/api/interviews/sessions/${sessionId}/report`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!response.ok) {
      let message = `Unable to download report (${response.status})`;
      try {
        message = (await response.json()).error || message;
      } catch {
        // Keep the status-based message when the server response is not JSON.
      }
      throw new Error(message);
    }
    return response.blob();
  },

  getInterviewReportUrl(sessionId) {
    return `${API_BASE}/api/interviews/sessions/${sessionId}/report`;
  },

  async createAtsApplication(jobId) {
    return requestJson(`${API_BASE}/api/ats/candidates`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ job_id: jobId })
    });
  },

  async getCandidateApplications() {
    return requestJson(`${API_BASE}/api/ats/candidates`, {
      headers: getAuthHeaders()
    });
  },

  async downloadMatchReport(jobId, candidateId) {
    const url = this.getPdfDownloadUrl(jobId, candidateId);
    const response = await fetch(url, { headers: getAuthHeaders() });
    if (!response.ok) {
      let message = `Unable to download report (${response.status})`;
      try {
        message = (await response.json()).error || message;
      } catch {
        // Keep the status-based message when the server response is not JSON.
      }
      throw new Error(message);
    }
    return response.blob();
  },

  // PDF Report URL
  getPdfDownloadUrl(jobId, candidateId) {
    let url = `${API_BASE}/api/reports/download-pdf`;
    const params = [];
    if (jobId) params.push(`job_id=${jobId}`);
    if (candidateId) params.push(`candidate_id=${candidateId}`);
    if (params.length > 0) url += `?${params.join("&")}`;
    return url;
  }
};
