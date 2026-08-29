import React, {
  useMemo,
  useState,
  useEffect
} from "react";

import "./App.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://codesentinel-6246.onrender.com";

function App() {

  const [githubUrl, setGithubUrl] = useState("");

  const [introComplete, setIntroComplete] = useState(false);
  const [dashboardVisible, setDashboardVisible] = useState(false);

  useEffect(() => {

    const timer = setTimeout(() => {

      setIntroComplete(true);

    }, 6500);

    return () => {

      clearTimeout(timer);

    };  

  }, []);
  const [zipFile, setZipFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [analysis, setAnalysis] = useState(null);
  const [initialAnalysis, setInitialAnalysis] = useState(null);
  const [remediationResults, setRemediationResults] = useState({});
  const [projectPath, setProjectPath] = useState("");

  const [filter, setFilter] = useState("ALL");
  const [expanded, setExpanded] = useState(null);
  const [aiLoading, setAiLoading] = useState(null);
const [aiResults, setAiResults] = useState({});
const [fixLoading, setFixLoading] = useState(null);
const [applyLoading, setApplyLoading] = useState(null);
const [verifyLoading, setVerifyLoading] =
  useState(null);
const [fixResults, setFixResults] = useState({});

const [verifyResults, setVerifyResults] = useState({});
const [copiedFix, setCopiedFix] = useState(null);
const getFindingKey = (finding) => {
  return [
    finding.type ||
      finding.title ||
      finding.name ||
      finding.message ||
      "",
    finding.file ||
      finding.filePath ||
      finding.path ||
      "",
    finding.line || ""
  ].join("::");
};
const [currentPage, setCurrentPage] = useState(1);

const findingsPerPage = 10;

  const [scanStage, setScanStage] = useState(
    "INITIALIZING SECURITY ENGINE"
  );

  const [scanProgress, setScanProgress] = useState(0);

  /* =====================================================
     SCAN ANIMATION
     ===================================================== */

  const startScanAnimation = () => {
    setLoading(true);
    setScanProgress(5);
    setScanStage("INITIALIZING SECURITY ENGINE");

    const stages = [
      [15, "CONNECTING TO GITHUB"],
      [30, "CLONING REPOSITORY"],
      [45, "LOADING SOURCE FILES"],
      [60, "SCANNING SOURCE CODE"],
      [75, "DETECTING VULNERABILITIES"],
      [88, "ANALYZING CODE QUALITY"],
      [96, "CALCULATING SECURITY RISK"],
    ];

    return stages.map(([progress, text], index) =>
      setTimeout(() => {
        setScanProgress(progress);
        setScanStage(text);
      }, (index + 1) * 650)
    );
  };

  /* =====================================================
     GITHUB ANALYSIS
     ===================================================== */

  const analyzeGithub = async () => {
    const repoUrl = githubUrl.trim();

    if (!repoUrl) {
      setError("Please enter a GitHub repository URL.");
      return;
    }

    if (
      !repoUrl.startsWith("https://github.com/") &&
      !repoUrl.startsWith("http://github.com/")
    ) {
      setError(
        "Please enter a valid GitHub repository URL."
      );
      return;
    }

    setError("");

    const timers = startScanAnimation();

    try {
      console.log(
        "Starting GitHub analysis:",
        repoUrl
      );

      const response = await fetch(
        `${API_BASE}/api/analyze-github`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            repoUrl,
          }),
        }
      );

      console.log(
        "Backend response status:",
        response.status
      );

      const text = await response.text();

      console.log(
        "Backend response:",
        text
      );

      let result;

      try {
        result = JSON.parse(text);
      } catch {
        throw new Error(
          "Backend returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          result.message ||
            result.error ||
            "GitHub analysis failed."
        );
      }

      const finalAnalysis =
  result.analysis ||
  result.data ||
  result;

if (result.projectPath) {
  setProjectPath(result.projectPath);

  console.log(
    "✓ Project path stored:",
    result.projectPath
  );
} else {
  console.warn(
    "⚠ No projectPath returned by backend"
  );
}
      console.log(
        "Final analysis:",
        finalAnalysis
      );

      timers.forEach(clearTimeout);

      setScanProgress(100);
      setScanStage(
        "SECURITY ANALYSIS COMPLETE"
      );

      setTimeout(() => {
  setDashboardVisible(false);
  setAnalysis(finalAnalysis);
  setInitialAnalysis(finalAnalysis);
  setLoading(false);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setDashboardVisible(true);
    });
  });
}, 700);
    } catch (err) {
      console.error(
        "GitHub analysis error:",
        err
      );

      timers.forEach(clearTimeout);

      setLoading(false);
      setScanProgress(0);
      setScanStage("ANALYSIS FAILED");

      setError(
  err.message?.toLowerCase().includes("timeout")
    ? "Repository analysis timed out. This repository is larger than the current scan capacity. Try a smaller repository or upload a focused project."
    : err.message ||
      "Failed to analyse GitHub repository."
);
    }
  };

  /* =====================================================
     ZIP ANALYSIS
     ===================================================== */

  const analyzeZip = async () => {
    if (!zipFile) {
      setError("Please select a ZIP file.");
      return;
    }

    setError("");

    const timers = startScanAnimation();

    try {
      const formData = new FormData();

      formData.append(
        "project",
        zipFile
      );

      const response = await fetch(
        `${API_BASE}/api/analyze`,
        {
          method: "POST",
          body: formData,
        }
      );

      const text =
        await response.text();

      let result;

      try {
        result = JSON.parse(text);
      } catch {
        throw new Error(
          "Backend returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          result.message ||
            result.error ||
            "ZIP analysis failed."
        );
      }

     const finalAnalysis =
  result.analysis ||
  result.data ||
  result;

if (result.projectPath) {
  setProjectPath(result.projectPath);

  console.log(
    "✓ Project path stored:",
    result.projectPath
  );
} else {
  console.warn(
    "⚠ No projectPath returned by backend"
  );
}

      timers.forEach(clearTimeout);

      setScanProgress(100);

      setScanStage(
        "SECURITY ANALYSIS COMPLETE"
      );

      setTimeout(() => {
  setDashboardVisible(false);
  setAnalysis(finalAnalysis);
  setInitialAnalysis(finalAnalysis);
  setLoading(false);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setDashboardVisible(true);
    });
  });
}, 700);
    } catch (err) {
      console.error(
        "ZIP analysis error:",
        err
      );

      timers.forEach(clearTimeout);

      setLoading(false);
      setScanProgress(0);

      setError(
        err.message ||
          "Failed to analyse ZIP project."
      );
    }
  };

  /* =====================================================
     NEW SCAN
     ===================================================== */

  const newScan = () => {
  setAnalysis(null);
  setInitialAnalysis(null);
  setRemediationResults({});
  setVerifyResults({});
  setFixResults({});
  
  setGithubUrl("");
  setZipFile(null);
  setError("");
  setFilter("ALL");
  setExpanded(null);
  setLoading(false);
  setScanProgress(0);
  setScanStage(
    "INITIALIZING SECURITY ENGINE"
  );
};

  /* =====================================================
     NORMALIZE ANALYSIS
     ===================================================== */

  const data = useMemo(() => {
    if (!analysis) {
      return null;
    }

    return {
      files:
        analysis.filesAnalyzed ??
        analysis.files ??
        0,

      lines:
        analysis.totalLines ??
        analysis.lines ??
        0,

      functions:
        analysis.totalFunctions ??
        analysis.functions ??
        0,

      classes:
        analysis.totalClasses ??
        analysis.classes ??
        0,

      complexity:
        analysis.totalComplexity ??
        analysis.complexity ??
        0,

      riskScore:
        analysis.riskScore ?? 0,

      riskLevel:
        analysis.riskLevel ||
        "LOW",

      securityIssues:
        Array.isArray(
          analysis.securityIssues
        )
          ? analysis.securityIssues
          : [],

      qualityIssues:
        Array.isArray(
          analysis.qualityIssues
        )
          ? analysis.qualityIssues
          : [],

      securitySummary:
        analysis.securitySummary ||
        {},
        secretsSummary:
  analysis.secretsSummary ||
  {},

      owaspSummary:
        analysis.owaspSummary ||
        {},

      topFindings:
        Array.isArray(
          analysis.topFindings
        )
          ? analysis.topFindings
          : [],

      analysisTime:
        analysis.analysisTime ?? 0,
    };
  }, [analysis]);
  const repositoryInfo = useMemo(() => {
  if (!githubUrl) {
    return null;
  }

  try {
    const url = new URL(githubUrl.trim());

    const parts = url.pathname
      .replace(/^\/+|\/+$/g, "")
      .split("/");

    if (parts.length < 2) {
      return null;
    }

    return {
      owner: parts[0],
      name: parts[1],
      url: `https://github.com/${parts[0]}/${parts[1]}`,
    };

  } catch {
    return null;
  }
}, [githubUrl]);
    const explainWithAI = async (finding, index) => {
    try {
      setAiLoading(index);

      const response = await fetch(
        `${API_BASE}/api/ai/explain`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            finding: {
              title:
                finding.type ||
                "Security Finding",

              severity:
                finding.severity ||
                "LOW",

              file:
                finding.file ||
                "Unknown file",

              line:
                finding.line ||
                "?",

              description:
                finding.message ||
                "No description available.",

              owasp:
                finding.owasp ||
                "",
            },

            sourceCode:
              finding.sourceCode ||
              finding.code ||
              "",
          }),
        }
      );
      const result =
        await response.json();
        console.log("AI RESPONSE:", result);

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
          "AI analysis failed."
        );
      }

      setAiResults((previous) => ({
        ...previous,
        [index]: result.ai,
      }));

    } catch (err) {
      console.error(
        "AI analysis error:",
        err
      );

      setAiResults((previous) => ({
        ...previous,
        [index]: {
          error:
            err.message ||
            "Unable to analyze finding.",
        },
      }));

    } finally {
      setAiLoading(null);
    }
  };


      const fixWithAI = async (finding, index) => {

  console.log("====================================");
  console.log("FIX WITH AI CLICKED");
  console.log("Finding:", finding);
  console.log("Source code:", finding?.sourceCode);
  console.log("Index:", index);

  // Create one consistent key for this finding
  const key = getFindingKey(finding);

  console.log("Finding key:", key);

  try {

    setFixLoading(index);

    const sourceCode =
      finding?.sourceCode ||
      finding?.code ||
      finding?.snippet ||
      finding?.source ||
      "";

    if (!sourceCode) {

      console.error(
        "No source code available for this finding."
      );

      setFixResults((previous) => ({
        ...previous,

        [key]: {
          error:
            "Source code is not available for this finding.",
        },

      }));

      return;
    }

    console.log(
      "Sending request to:",
      `${API_BASE}/api/ai/fix`
    );

    const response = await fetch(
      `${API_BASE}/api/ai/fix`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          finding: finding,
          sourceCode: sourceCode,
        }),
      }
    );

    console.log(
      "AI Fix response status:",
      response.status
    );

    const text =
      await response.text();

    console.log(
      "AI Fix response:",
      text
    );

    let result;

    try {

      result = JSON.parse(text);

    } catch {

      throw new Error(
        "Backend returned an invalid AI fix response."
      );

    }

    console.log(
      "Parsed AI fix result:",
      result
    );

    if (!response.ok) {

      throw new Error(
        result.message ||
        result.error ||
        "AI fix generation failed."
      );

    }

    if (!result.fix) {

      throw new Error(
        "Backend generated a response, but no fix was returned."
      );

    }

    console.log(
      "Generated fix:",
      result.fix
    );

    // IMPORTANT:
    // Store the result using the same key
    // that the dashboard uses to display it.
    setFixResults((previous) => ({
      ...previous,

      [key]: result.fix,

    }));

    console.log(
      "✓ AI fix stored successfully"
    );

  } catch (error) {

  console.error(
    "AI FIX ERROR:",
    error
  );

  setFixResults((previous) => ({
    ...previous,

    [key]: {
      error:
        "Groq is temporarily unavailable. Please try again in a few seconds.",
    },
  }));

}finally {

    setFixLoading(null);

  }

};
const applyFix = async (finding, index) => {

  console.log("====================================");
  console.log("APPLY FIX CLICKED");
  console.log("Finding:", finding);
  console.log("Project path:", projectPath);

  const key = getFindingKey(finding);

  const fix = fixResults[key];

  console.log("Finding key:", key);
  console.log("Fix:", fix);

  try {

    setApplyLoading(index);

    if (!fix || !fix.fixedCode) {

      throw new Error(
        "Generate an AI fix before applying it."
      );

    }

    if (!projectPath) {

      throw new Error(
        "Project path is not available. Please scan the project again."
      );

    }

    // KEEP THE REST OF YOUR EXISTING CODE HERE

    setFixLoading(index);

    const response =
      await fetch(
        `${API_BASE}/api/apply-fix`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({

            projectPath:
              projectPath,

            finding:
              finding,

            fixedCode:
              fix.fixedCode,

          }),

        }
      );

    const result =
      await response.json();

    console.log(
      "Apply fix response:",
      result
    );

    if (
      !response.ok ||
      !result.success
    ) {

      throw new Error(
        result.message ||
        "Failed to apply AI fix."
      );

    }
   setRemediationResults((previous) => {

  const existing = previous[key] || {};

  return {
    ...previous,

    [key]: {
      ...existing,

      finding: finding.type,

      beforeIssues:
        existing.beforeIssues ??
        initialAnalysis?.securityIssues?.length ??
        0,

      beforeRisk:
        existing.beforeRisk ??
        initialAnalysis?.riskScore ??
        0,

      afterIssues:
        existing.afterIssues ?? null,

      afterRisk:
        existing.afterRisk ?? null,

      verified: false,
    },
  };

});

    setVerifyResults(
      (previous) => ({
        ...previous,

        [index]: {
          applied: true,

          message:
            "AI fix applied successfully. Ready for verification."
        },

      })
    );

  } catch (error) {

    console.error(
      "APPLY FIX ERROR:",
      error
    );

    setVerifyResults(
      (previous) => ({
        ...previous,

        [index]: {
          error:
            error.message ||
            "Unable to apply AI fix."
        },

      })
    );

  } finally {

    setFixLoading(null);

  }

};
const verifyFinding = async (finding, index) => {

  console.log("🔵 VERIFY BUTTON CLICKED");
  console.log("Finding:", finding);
  console.log("Project path:", projectPath);

  // IMPORTANT: use the same key as fixWithAI()
  const key = getFindingKey(finding);

  console.log("Finding key:", key);
  console.log("Fix result:", fixResults[key]);

  try {

    setVerifyLoading(index);

    if (!projectPath) {

      throw new Error(
        "Project is no longer available for verification."
      );

    }

    if (!fixResults[key]) {

      throw new Error(
        "Generate an AI fix before verifying."
      );

    }

    console.log(
      "===================================="
    );

    console.log(
      "VERIFYING SECURITY FIX"
    );

    const response = await fetch(
      `${API_BASE}/api/verify-fix`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({

          projectPath: projectPath,

          finding: finding,

        }),
      }
    );

    const result =
      await response.json();

    if (!response.ok || !result.success) {

      throw new Error(
        result.message ||
        "Fix verification failed."
      );

    }

    //setVerifyResults((previous) => ({
    //  ...previous,

    //  [index]: {
    //    applied: true,
     //   message:
     //     "AI fix applied successfully. Ready for verification."
     // },

   // }));

// Update dashboard after a successful verification
if (result.analysis) {

  setAnalysis(result.analysis);

  setRemediationResults((previous) => ({
  ...previous,

  [key]: {
    ...(previous[key] || {}),

    finding: finding.type,

    beforeIssues:
      previous[key]?.beforeIssues ??
      initialAnalysis?.securityIssues?.length ??
      0,

    beforeRisk:
      previous[key]?.beforeRisk ??
      initialAnalysis?.riskScore ??
      0,

    afterIssues:
      result.analysis.securityIssues?.length ?? 0,

    afterRisk:
      result.analysis.riskScore ?? 0,

    verified:
      result.verified === true,
  },
}));
  setVerifyResults((previous) => ({
  ...previous,

  [index]: {
    ...(previous[index] || {}),

    applied: true,
    verified: result.verified === true,

    message:
      result.verified === true
        ? "AI fix successfully verified."
        : "Fix verification completed, but the vulnerability is still present."
  },
}));

} else {

  // Verification completed, but backend did not return
  // a full analysis object.
  setRemediationResults((previous) => ({
    ...previous,

    [index]: {
      ...(previous[index] || {}),

      finding: finding.type,

      verified: result.verified === true,
    },
  }));

}
    console.log(
      result.verified
        ? "✓ FINDING RESOLVED"
        : "✗ FINDING STILL PRESENT"
    );

  } catch (error) {

    console.error(
      "VERIFY FIX ERROR:",
      error
    );

    setVerifyResults((previous) => ({

      ...previous,

      [index]: {
        verified: false,
        error:
          error.message ||
          "Unable to verify fix.",
      },

    }));

  } finally {

    setVerifyLoading(null);

  }

};
const copyFix = async (code, index) => {
  if (!code) return;

  try {
    if (
      navigator.clipboard &&
      window.isSecureContext
    ) {
      await navigator.clipboard.writeText(code);
    } else {
      const textArea =
        document.createElement("textarea");

      textArea.value = code;

      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "-9999px";

      document.body.appendChild(textArea);

      textArea.focus();
      textArea.select();

      const successful =
        document.execCommand("copy");

      document.body.removeChild(textArea);

      if (!successful) {
        throw new Error("Copy failed");
      }
    }

    setCopiedFix(index);

    setTimeout(() => {
      setCopiedFix(null);
    }, 2000);

  } catch (error) {
    console.error(
      "Copy Fix failed:",
      error
    );

    alert("Unable to copy the code.");
  }
};

      
  /* =====================================================
     FINDINGS
     ===================================================== */

  const findings = useMemo(() => {
  if (!data) {
    return [];
  }

  let list =
    data.securityIssues.length > 0
      ? data.securityIssues
      : data.topFindings;

  if (filter !== "ALL") {
    list = list.filter(
      (item) =>
        String(
          item.severity || ""
        ).toUpperCase() === filter
    );
  }

  // Return ALL findings.
  // Pagination will show 10 at a time.
  return list;
}, [data, filter]);
const totalPages = Math.ceil(
  findings.length / findingsPerPage
);

const startIndex =
  (currentPage - 1) * findingsPerPage;

const paginatedFindings =
  findings.slice(
    startIndex,
    startIndex + findingsPerPage
  );


  /* =====================================================
     SEVERITY COUNTS
     ===================================================== */

  const calculateCount = (
    severity
  ) => {
    if (!data) {
      return 0;
    }

    return data.securityIssues.filter(
      (item) =>
        String(
          item.severity || ""
        ).toUpperCase() === severity
    ).length;
  };

  const counts = {
    high:
      data?.securitySummary?.high ??
      calculateCount("HIGH"),

    medium:
      data?.securitySummary?.medium ??
      calculateCount("MEDIUM"),

    low:
      data?.securitySummary?.low ??
      calculateCount("LOW"),
  };
  const riskStatus =
  data?.riskScore >= 70
    ? "CRITICAL RISK"
    : data?.riskScore >= 40
    ? "MODERATE RISK"
    : "LOW RISK";

    

  /* =====================================================
     DOWNLOAD REPORT
     ===================================================== */

  const downloadReport = () => {
    if (!data) {
      return;
    }

    const escapeHtml = (value) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const allFindings =
  data.securityIssues.length > 0
    ? data.securityIssues
    : data.topFindings;
    const secretFindings =
  data.securityIssues.filter(
    (finding) =>
      finding.type === "Exposed Secret" ||
      finding.type === "Exposed Private Key" ||
      finding.type === "API Key" ||
      finding.type === "Access Token" ||
      finding.type === "JWT Secret"
  );

    const findingsHtml =
      allFindings
        .map(
          (finding, index) => `
          <div class="finding">

            <div class="finding-number">
              ${String(
                index + 1
              ).padStart(2, "0")}
            </div>

            <div class="finding-content">

              <h3>
                ${escapeHtml(
                  finding.type ||
                    "Security Finding"
                )}

                <span class="severity ${String(
                  finding.severity ||
                    "LOW"
                ).toLowerCase()}">

                  ${escapeHtml(
                    finding.severity ||
                      "LOW"
                  )}

                </span>
              </h3>

              <p class="location">

                ${escapeHtml(
                  finding.file ||
                    "Unknown file"
                )}

                :

                ${escapeHtml(
                  finding.line || "?"
                )}

                ${
                  finding.owasp
                    ? ` • ${escapeHtml(
                        finding.owasp
                      )}`
                    : ""
                }

              </p>

              <p>
                ${escapeHtml(
                  finding.message ||
                    "No description available."
                )}
              </p>

              <div class="fix">

                <strong>
                  Recommended Fix
                </strong>

                <p>
                  ${escapeHtml(
                    finding.recommendation ||
                      "Review and remediate this finding."
                  )}
                </p>

              </div>

              <div class="confidence">
                Confidence:
                ${escapeHtml(
                  finding.confidence ?? 0
                )}%
              </div>
              ${
  aiResults[index] &&
  !aiResults[index].error
    ? `
      <div class="ai-report">

        <h4>AI Assessment</h4>

        <p>
          ${escapeHtml(
            aiResults[index].explanation ||
              "No explanation returned."
          )}
        </p>

        <h4>Root Cause</h4>

        <p>
          ${escapeHtml(
            aiResults[index].rootCause ||
              "No root cause identified."
          )}
        </p>

        <h4>Security Impact</h4>

        <p>
          ${escapeHtml(
            aiResults[index].impact ||
              "No impact information returned."
          )}
        </p>

        <h4>AI Confidence</h4>

        <p>
          ${escapeHtml(
            aiResults[index].confidence ?? 0
          )}%
        </p>

        ${
          aiResults[index].secureCode
            ? `
              <h4>Secure Code</h4>

              <pre>
                ${escapeHtml(
                  aiResults[index].secureCode
                )}
              </pre>
            `
            : ""
        }

      </div>
    `
    : ""
}

            </div>
          </div>
        `
        )
        .join("");

    const riskColor =
      data.riskScore >= 70
        ? "#ff626d"
        : data.riskScore >= 40
        ? "#ffc451"
        : "#4ddd96";

    const report = `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta name="viewport"
      content="width=device-width,initial-scale=1">

<title>
CodeSentinel Security Report
</title>

<style>

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 40px;

  font-family:
    Arial,
    Helvetica,
    sans-serif;

  background: #080b14;

  color: #e9ecf5;
}

.container {
  max-width: 1050px;

  margin: auto;
}

.header {
  padding: 32px;

  border-radius: 18px;

  background:
    linear-gradient(
      135deg,
      #11182b,
      #0b1020
    );

  border: 1px solid #242c43;
}

.logo {
  color: #8b78ff;

  font-size: 13px;

  font-weight: bold;

  letter-spacing: 3px;
}

h1 {
  margin: 12px 0 5px;

  font-size: 36px;
}

.subtitle {
  color: #7d879d;

  font-size: 13px;
}

.date {
  margin-top: 18px;

  color: #5e687d;

  font-size: 11px;
}

.risk {
  margin-top: 20px;

  padding: 25px;

  border-radius: 14px;

  background: #101626;

  border: 1px solid #242c43;
}

.risk-title {
  color: #778198;

  font-size: 11px;

  letter-spacing: 2px;
}

.risk-score {
  margin-top: 8px;

  color: ${riskColor};

  font-size: 45px;

  font-weight: bold;
}

.risk-level {
  color: #9da6b8;

  font-size: 13px;
}

.metrics {
  display: grid;

  grid-template-columns:
    repeat(3,1fr);

  gap: 12px;

  margin-top: 18px;
}

.metric {
  padding: 20px;

  border-radius: 12px;

  background: #101626;

  border: 1px solid #222a40;
}

.metric-title {
  color: #687289;

  font-size: 10px;

  text-transform: uppercase;
}

.metric-value {
  margin-top: 10px;

  font-size: 27px;

  font-weight: bold;
}

.section {
  margin-top: 30px;
}

.section-title {
  margin-bottom: 8px;

  color: #8b78ff;

  font-size: 10px;

  font-weight: bold;

  letter-spacing: 2px;
}

.section h2 {
  margin:
    0 0 15px;

  font-size: 21px;
}

.severity-grid {
  display: grid;

  grid-template-columns:
    repeat(3,1fr);

  gap: 12px;
}

.severity-card {
  padding: 18px;

  border-radius: 12px;

  background: #101626;

  border: 1px solid #222a40;
}

.severity-card strong {
  display: block;

  margin-top: 8px;

  font-size: 26px;
}

.high {
  color: #ff626d;
}

.medium {
  color: #ffc451;
}

.low {
  color: #4ddd96;
}

.finding {
  display: flex;

  gap: 15px;

  margin-bottom: 12px;

  padding: 20px;

  border-radius: 12px;

  background: #101626;

  border: 1px solid #222a40;
}

.finding-number {
  color: #505a70;

  font-size: 12px;

  font-weight: bold;
}

.finding-content {
  flex: 1;
}

.finding h3 {
  margin: 0;

  font-size: 14px;
}

.severity {
  margin-left: 8px;

  padding: 3px 7px;

  border-radius: 4px;

  background:
    rgba(255,255,255,.05);

  font-size: 8px;
}

.location {
  color: #59647b;

  font-size: 10px;
}

.finding-content > p {
  color: #8a94a9;

  font-size: 11px;

  line-height: 1.6;
}

.fix {
  margin-top: 12px;

  padding: 12px;

  border-radius: 8px;

  background:
    rgba(110,80,255,.05);
}

.fix strong {
  color: #9a88ff;

  font-size: 10px;
}

.fix p {
  margin-bottom: 0;
}

.confidence {
  margin-top: 10px;

  color: #667086;

  font-size: 9px;
}

.footer {
  margin-top: 40px;

  padding-top: 18px;

  border-top:
    1px solid #222a40;

  color: #59647a;

  font-size: 10px;

  text-align: center;
}

@media(max-width:700px) {

  body {
    padding: 15px;
  }

  .metrics,
  .severity-grid {
    grid-template-columns: 1fr;
  }

}

</style>

</head>

<body>

<div class="container">

<div class="header">

<div class="logo">
CODESENTINEL
</div>

<h1>
Security Analysis Report
</h1>

<div class="subtitle">
Intelligent Code Security Platform
</div>

<div class="date">
Generated:
${escapeHtml(
  new Date().toLocaleString()
)}
</div>

</div>


<div class="risk">

<div class="risk-title">
SECURITY RISK SCORE
</div>

<div class="risk-score">
${escapeHtml(
  data.riskScore
)}/100
</div>

<div class="risk-level">
Risk Level:
${escapeHtml(
  data.riskLevel
)}
</div>

</div>


<div class="metrics">

<div class="metric">
<div class="metric-title">
Files
</div>

<div class="metric-value">
${Number(
  data.files
).toLocaleString()}
</div>
</div>


<div class="metric">
<div class="metric-title">
Lines
</div>

<div class="metric-value">
${Number(
  data.lines
).toLocaleString()}
</div>
</div>


<div class="metric">
<div class="metric-title">
Functions
</div>

<div class="metric-value">
${Number(
  data.functions
).toLocaleString()}
</div>
</div>


<div class="metric">
<div class="metric-title">
Classes
</div>

<div class="metric-value">
${Number(
  data.classes
).toLocaleString()}
</div>
</div>


<div class="metric">
<div class="metric-title">
Complexity
</div>

<div class="metric-value">
${Number(
  data.complexity
).toLocaleString()}
</div>
</div>


<div class="metric">
<div class="metric-title">
Quality Findings
</div>

<div class="metric-value">
${data.qualityIssues.length}
</div>
</div>

</div>


<div class="section">

<div class="section-title">
SECURITY POSTURE
</div>

<h2>
Vulnerability Summary
</h2>

<div class="severity-grid">

<div class="severity-card">
<span class="high">
HIGH
</span>

<strong>
${counts.high}
</strong>
</div>


<div class="severity-card">
<span class="medium">
MEDIUM
</span>

<strong>
${counts.medium}
</strong>
</div>


<div class="severity-card">
<span class="low">
LOW
</span>

<strong>
${counts.low}
</strong>
</div>

</div>

</div>


<div class="section">

<div class="section-title">
PRIORITIZED RESULTS
</div>

<h2>
Top 10 Security Findings
</h2>
${
  secretFindings.length > 0
    ? `
      <div class="section">

        <div class="section-title">
          SECRET DETECTION
        </div>

        <h2>
          Secrets Detected
        </h2>

        ${secretFindings
          .slice(0, 5)
          .map(
            (finding) => `
              <div class="finding">

                <div class="finding-content">

                  <h3>
                    ${escapeHtml(
                      finding.type ||
                        "Exposed Secret"
                    )}

                    <span class="severity high">
                      HIGH
                    </span>
                  </h3>

                  <p class="location">
                    ${escapeHtml(
                      finding.file ||
                        "Unknown file"
                    )}
                    :
                    ${escapeHtml(
                      finding.line || "?"
                    )}
                  </p>

                  ${
                    finding.sourceCode
                      ? `
                        <pre style="
                          padding:12px;
                          border-radius:8px;
                          background:#080b14;
                          color:#8a94a9;
                          overflow:auto;
                          font-size:11px;
                        ">${escapeHtml(
                          finding.sourceCode
                        )}</pre>
                      `
                      : ""
                  }

                  <p>
                    Secret detected and masked
                    for security.
                  </p>

                </div>

              </div>
            `
          )
          .join("")}

      </div>
    `
    : ""
}

${
  findingsHtml ||
  "<p>No security findings available.</p>"
}

</div>


<div class="footer">

CodeSentinel —
Intelligent Code Security Platform

</div>

</div>

</body>

</html>
`;

    const blob = new Blob(
      [report],
      {
        type: "text/html",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `CodeSentinel-Security-Report-${new Date()
        .toISOString()
        .slice(0, 10)}.html`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  };

  /* =====================================================
     LANDING PAGE
     ===================================================== */

  if (!data) {
    return (
      <div className="app landing-page">
                {!introComplete && (
          <div className="code-sentinel-intro">

            <div className="intro-logo">

  <svg
    className="intro-logo-svg"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >

    <path
      d="M24 3.5L40 9.5V21.5C40 32.2 33.2 41.2 24 44.5C14.8 41.2 8 32.2 8 21.5V9.5L24 3.5Z"
      fill="url(#introShieldGradient)"
      fillOpacity="0.18"
      stroke="url(#introShieldStroke)"
      strokeWidth="1.8"
    />

    <path
      d="M17 19L21.5 24L17 29"
      stroke="#B8AEFF"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    <path
      d="M23 31H31"
      stroke="#6FE7FF"
      strokeWidth="2.4"
      strokeLinecap="round"
    />

    <circle
      cx="24"
      cy="15"
      r="1.7"
      fill="#6FE7FF"
    />

    <defs>

      <linearGradient
        id="introShieldGradient"
        x1="8"
        y1="4"
        x2="40"
        y2="44"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#536FFF" />
        <stop offset="0.5" stopColor="#8A4DFF" />
        <stop offset="1" stopColor="#C45CFF" />
      </linearGradient>

      <linearGradient
        id="introShieldStroke"
        x1="8"
        y1="4"
        x2="40"
        y2="44"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#6D8CFF" />
        <stop offset="0.5" stopColor="#9B62FF" />
        <stop offset="1" stopColor="#65E7FF" />
      </linearGradient>

    </defs>

  </svg>

</div>

            <div className="energy-transition">
  <div className="energy-ring ring-1"></div>
  <div className="energy-ring ring-2"></div>
  <div className="energy-ring ring-3"></div>
  <div className="energy-core"></div>
</div>

            <div className="intro-title">
              CODE SENTINEL
            </div>

            <div className="intro-subtitle">
              SECURITY INTELLIGENCE ENGINE
            </div>

          </div>
        )}

        <div className="grid-background" />
        <div className="scan-grid-lines" />

        <div className="orb orb-one" />
        <div className="orb orb-two" />
        <div className="orb orb-three" />

        <div className="floating-particle particle-1" />
        <div className="floating-particle particle-2" />
        <div className="floating-particle particle-3" />
        <div className="floating-particle particle-4" />
        <div className="floating-particle particle-5" />
        <div className="floating-particle particle-6" />
        <div className="floating-particle particle-7" />
        <div className="floating-particle particle-8" />

        <div className="data-stream stream-1">
          101101001101001011010
        </div>

        <div className="data-stream stream-2">
          SECURE // ANALYZE // DETECT
        </div>

        <div className="data-stream stream-3">
          010010110101101001101
        </div>

        <div className="data-stream stream-4">
          SECURITY_ENGINE_ACTIVE
        </div>

        <div className="background-scanner-beam" />


        {/* NAVBAR */}

        <header className="navbar">

          <div className="logo-area">

            <div className="logo-area">

  <div className="logo">

    <svg
      className="logo-shield"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M24 3.5L40 9.5V21.5C40 32.2 33.2 41.2 24 44.5C14.8 41.2 8 32.2 8 21.5V9.5L24 3.5Z"
        fill="url(#shieldGradient)"
        fillOpacity="0.18"
        stroke="url(#shieldStroke)"
        strokeWidth="1.8"
      />

      <path
        d="M17 19L21.5 24L17 29"
        stroke="#B8AEFF"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M23 31H31"
        stroke="#6FE7FF"
        strokeWidth="2.4"
        strokeLinecap="round"
      />

      <circle
        cx="24"
        cy="15"
        r="1.7"
        fill="#6FE7FF"
      />

      <defs>

        <linearGradient
          id="shieldGradient"
          x1="8"
          y1="4"
          x2="40"
          y2="44"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#536FFF" />
          <stop
            offset="0.5"
            stopColor="#8A4DFF"
          />
          <stop
            offset="1"
            stopColor="#C45CFF"
          />
        </linearGradient>

        <linearGradient
          id="shieldStroke"
          x1="8"
          y1="4"
          x2="40"
          y2="44"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#6D8CFF" />
          <stop
            offset="0.5"
            stopColor="#9B62FF"
          />
          <stop
            offset="1"
            stopColor="#65E7FF"
          />
        </linearGradient>

      </defs>

    </svg>

  </div>


  <div>

    <div className="logo-title">
      CodeSentinel
    </div>

    <div className="logo-subtitle">
      Security Intelligence
    </div>

  </div>

</div>

            

          </div>


          <div className="online">

            <span />

            Scanner Online

          </div>

        </header>


        {/* HERO */}

        <main className="hero-container">

          <div className="hero-badge">

            <span className="badge-pulse" />

            AI-POWERED SECURITY ANALYSIS

          </div>


          <h1 className="hero-title">

            Secure your code.

            <br />

            <span>
              Before attackers do.
            </span>

          </h1>


          <p className="hero-description">

            Analyze GitHub repositories or upload
            your project to discover vulnerabilities,
            quality issues, OWASP risks and
            actionable security insights.

          </p>


          <div className="live-security">

            <span className="live-dot" />

            <span>
              LIVE SECURITY ENGINE
            </span>

            <i />

            <span className="live-value">
              READY
            </span>

          </div>


          {/* SCANNER CARD */}

          <section className="scanner-card">

            <div className="scanner-border" />

            <div className="card-scan-line" />


            {/* ZIP */}

            <div className="scan-option">

              <div className="option-title">

                <div className="option-icon zip">

                  <div className="zip-file-icon">

                    <div className="zip-fold" />

                    <div className="zip-label">
                      ZIP
                    </div>

                    <div className="zip-zipper">

                      <span />
                      <span />
                      <span />
                      <span />

                    </div>

                  </div>

                </div>


                <div>

                  <h2>
                    Project ZIP
                  </h2>

                  <p>
                    Upload your source code
                  </p>

                </div>

              </div>


              <label className="file-box">

                <input
                  type="file"
                  accept=".zip"
                  onChange={(e) => {

                    setZipFile(
                      e.target.files?.[0] ||
                        null
                    );

                    setError("");

                  }}
                />


                <div className="file-preview-icon">
                  ZIP
                </div>


                <span>

                  {zipFile
                    ? zipFile.name
                    : "Choose project ZIP file"}

                </span>


                <b>
                  →
                </b>

              </label>


              <button
                className="scan-button blue"
                onClick={analyzeZip}
                disabled={loading}
              >

                <span className="button-shine" />

                {loading
                  ? "SCANNING..."
                  : "Launch Security Scan →"}

              </button>

            </div>


            {/* OR */}

            <div className="or-divider">

              <span />

              <div className="or-circle">
                OR
              </div>

              <span />

            </div>


            {/* GITHUB */}

            <div className="scan-option">

              <div className="option-title">

                <div className="option-icon github">

                  <svg
                    className="github-logo"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >

                    <path
                      fill="currentColor"
                      d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55v-2.16c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.33.95.1-.74.4-1.24.72-1.53-2.55-.29-5.23-1.28-5.23-5.68 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.45.11-3.03 0 0 .96-.31 3.15 1.17a10.94 10.94 0 0 1 5.74 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.58.23 2.74.11 3.03.73.8 1.18 1.82 1.18 3.07 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.04.77 2.1v3.11c0 .3.21.66.79.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"
                    />

                  </svg>

                </div>


                <div>

                  <h2>
                    Connect GitHub
                  </h2>

                  <p>
                    Analyze a public repository
                  </p>

                </div>

              </div>


              <div className="github-box">

  <div className="github-small">

    <svg
      className="github-small-logo"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55v-2.16c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.33.95.1-.74.4-1.24.72-1.53-2.55-.29-5.23-1.28-5.23-5.68 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.45.11-3.03 0 0 .96-.31 3.15 1.17a10.94 10.94 0 0 1 5.74 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.58.23 2.74.11 3.03.73.8 1.18 1.82 1.18 3.07 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.04.77 2.1v3.11c0 .3.21.66.79.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"
      />
    </svg>

  </div>

  <input
    value={githubUrl}
    onChange={(e) =>
      setGithubUrl(
        e.target.value
      )
    }
    onKeyDown={(e) => {

      if (
        e.key === "Enter"
      ) {
        analyzeGithub();
      }

    }}
    placeholder="https://github.com/user/repository"
  />

</div>


              <button
                className="scan-button purple"
                onClick={analyzeGithub}
                disabled={loading}
              >

                <span className="button-shine" />

                {loading
                  ? "ANALYZING..."
                  : "Analyze GitHub Repository ↗"}

              </button>

            </div>


            {error && (

              <div className="error-box">

                <strong>
                  !
                </strong>

                <span>
                  {error}
                </span>

              </div>

            )}

          </section>


          {/* FEATURES */}

          <div className="feature-row">

            <div className="feature-item">

              <span className="feature-icon">
                ◈
              </span>

              <div>

                <strong>
                  Static Analysis
                </strong>

                <small>
                  Deep source inspection
                </small>

              </div>

            </div>


            <div className="feature-item">

              <span className="feature-icon">
                ◇
              </span>

              <div>

                <strong>
                  OWASP Mapping
                </strong>

                <small>
                  Industry security standards
                </small>

              </div>

            </div>


            <div className="feature-item">

              <span className="feature-icon">
                ✦
              </span>

              <div>

                <strong>
                  AI Security
                </strong>

                <small>
                  Intelligent risk detection
                </small>

              </div>

            </div>

          </div>

        </main>


        {/* SCAN OVERLAY */}

        {loading && (

          <div className="scan-overlay">

            <div className="scan-overlay-grid" />

            <div className="massive-scan-line" />


            <div className="scan-container">

              <div className="scan-corner top-left" />
              <div className="scan-corner top-right" />
              <div className="scan-corner bottom-left" />
              <div className="scan-corner bottom-right" />


              <div className="scan-core">

                <div className="scan-orbit orbit-a" />

                <div className="scan-orbit orbit-b" />

                <div className="scan-orbit orbit-c" />

                <div className="scan-core-ring">
                  <span />
                </div>

                <div className="scan-core-inner">

                  <div className="core-brackets">
                    [ ]
                  </div>

                  <div className="core-dot" />

                </div>

                <div className="scan-crosshair">
                  +
                </div>

              </div>


              <div className="scan-title">
                CODESENTINEL
              </div>

              <div className="scan-subtitle">
                SECURITY ENGINE
              </div>


              <div className="scan-status">
                {scanStage}
              </div>


              <div className="scan-progress">

                <div
                  className="scan-progress-fill"
                  style={{
                    width:
                      `${scanProgress}%`,
                  }}
                />

              </div>


              <div className="scan-progress-info">

                <span>
                  ANALYSIS PROGRESS
                </span>

                <strong>
                  {scanProgress}%
                </strong>

              </div>


              <div className="scan-lines">

                <ScanStep
                  label="PROJECT CONNECTION"
                  active={
                    scanProgress >= 15
                  }
                  complete={
                    scanProgress >= 30
                  }
                />

                <ScanStep
                  label="SOURCE ANALYSIS"
                  active={
                    scanProgress >= 30
                  }
                  complete={
                    scanProgress >= 60
                  }
                />

                <ScanStep
                  label="VULNERABILITY ENGINE"
                  active={
                    scanProgress >= 60
                  }
                  complete={
                    scanProgress >= 75
                  }
                />

                <ScanStep
                  label="RISK ASSESSMENT"
                  active={
                    scanProgress >= 75
                  }
                  complete={
                    scanProgress >= 100
                  }
                />

              </div>


             <div className="scan-warning">

  <span className="warning-dot" />

  {scanProgress >= 96 ? (
    <>
      <strong>
        ↻ FINALIZING REPORT
      </strong>

      <span>
        Preparing security findings and risk score...
      </span>

      <small>
        This may take a few seconds.
      </small>
    </>
  ) : (
    <>
      <strong>
        ANALYSIS IN PROGRESS
      </strong>

      <span>
        Your project is being analyzed...
      </span>
    </>
  )}

</div>

            </div>

          </div>

        )}

      </div>
    );
  }


  /* =====================================================
     RESULTS PAGE
     ===================================================== */

  return (
  <div
  className={`app results ${
    dashboardVisible
      ? "dashboard-show"
      : "dashboard-hidden"
  }`}
>

      <div className="grid-background" /> 

      <div className="orb orb-one" />
      <div className="orb orb-two" />


      <header className="navbar">

        <div className="logo-area">

  <div className="logo">
    <svg
      className="logo-shield"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M24 3.5L40 9.5V21.5C40 32.2 33.2 41.2 24 44.5C14.8 41.2 8 32.2 8 21.5V9.5L24 3.5Z"
        fill="url(#shieldGradient)"
        fillOpacity="0.18"
        stroke="url(#shieldStroke)"
        strokeWidth="1.8"
      />

      <path
        d="M17 19L21.5 24L17 29"
        stroke="#B8AEFF"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M23 31H31"
        stroke="#6FE7FF"
        strokeWidth="2.4"
        strokeLinecap="round"
      />

      <circle
        cx="24"
        cy="15"
        r="1.7"
        fill="#6FE7FF"
      />

      <defs>
        <linearGradient
          id="shieldGradient"
          x1="8"
          y1="4"
          x2="40"
          y2="44"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#536FFF" />
          <stop
            offset="0.5"
            stopColor="#8A4DFF"
          />
          <stop
            offset="1"
            stopColor="#C45CFF"
          />
        </linearGradient>

        <linearGradient
          id="shieldStroke"
          x1="8"
          y1="4"
          x2="40"
          y2="44"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#6D8CFF" />
          <stop
            offset="0.5"
            stopColor="#9B62FF"
          />
          <stop
            offset="1"
            stopColor="#65E7FF"
          />
        </linearGradient>
      </defs>
    </svg>
  </div>

  <div>

    <div className="logo-title">
      CodeSentinel
    </div>

    <div className="logo-subtitle">
      Security Intelligence
    </div>

  </div>

</div>


        <div className="header-buttons">

          <button
  className="download-report"
  onClick={downloadReport}
>
  ↓ Download Report
</button>


          <button
            onClick={() =>
              window.open(
                `${API_BASE}/api/health`,
                "_blank"
              )
            }
          >
            API Health
          </button>


          <button
            onClick={newScan}
          >
            + New Scan
          </button>

        </div>

      </header>


      <main className="results-container">

        {/* RESULTS HEADER */}

        <div className="results-heading">

          <div>

            <span className="eyebrow">
              ANALYSIS COMPLETE
            </span>

            <h1>
              Security Overview
            </h1>

            <p>
              Your project has been analyzed
              for security and quality risks.
            </p>
            {repositoryInfo && (
  <div className="repository-info">

   <div className="repository-icon">
  ◈
</div>

    <div className="repository-details">
      <span>ANALYZED REPOSITORY</span>

      <strong>
        {repositoryInfo.owner} / {repositoryInfo.name}
      </strong>
    </div>

    <button
      type="button"
      className="repository-link"
      onClick={() =>
        window.open(
          repositoryInfo.url,
          "_blank",
          "noopener,noreferrer"
        )
      }
    >
      View on GitHub ↗
    </button>

  </div>
)}
<div className="scan-meta">

  <span>
    {data.files.toLocaleString()} files
  </span>

  <span>•</span>

  <span>
    {data.lines.toLocaleString()} lines
  </span>

  <span>•</span>

  <span>
    Analysis completed in{" "}
    {(data.analysisTime / 1000).toFixed(1)}s
  </span>

</div>


          </div>


          <div className="risk-badge">

            <small>
              RISK LEVEL
            </small>

            <strong
              className={
                data.riskLevel.toLowerCase()
              }
            >
              {data.riskLevel}
            </strong>

          </div>

        </div>


        {/* METRICS */}

        <section className="metrics">

          <Metric
            title="Files"
            value={data.files}
            icon="▦"
          />

          <Metric
            title="Lines"
            value={data.lines}
            icon="≡"
          />

          <Metric
            title="Functions"
            value={data.functions}
            icon="ƒ"
          />

          <Metric
            title="Classes"
            value={data.classes}
            icon="◇"
          />

          <Metric
            title="Complexity"
            value={data.complexity}
            icon="⌁"
          />

          <Metric
            title="Risk Score"
            value={`${data.riskScore}/100`}
            icon="◈"
            special
          />

        </section>


        {/* SECURITY PANEL */}

        <section className="security-panel">

          <div className="panel-title">

            <div>

              <span className="eyebrow">
                SECURITY POSTURE
              </span>

              <h2>
                {data.securityIssues.length}
                {" "}
                Security Findings
              </h2>

            </div>


            <div className="risk-number">

  <small>
    RISK SCORE
  </small>

  <strong>
    {data.riskScore}
    <span>/100</span>
  </strong>

  <em>
    {riskStatus}
  </em>

</div>

          </div>


          <div className="security-content">

            <div className="risk-progress">

              <div className="progress-track">

                <div
                  className="progress-fill"
                  style={{
                    width:
                      `${Math.min(
                        data.riskScore,
                        100
                      )}%`,
                  }}
                />

              </div>


              <div className="progress-labels">

                <span>
                  LOW
                </span>

                <span>
                  MEDIUM
                </span>

                <span>
                  HIGH
                </span>

              </div>

            </div>


            <div className="severity-cards">

              <Severity
                name="HIGH"
                count={counts.high}
                type="high"
                active={
                  filter === "HIGH"
                }
                onClick={() => {
  setFilter("HIGH");
  setExpanded(null);
  setAiResults({});
}}
              />


              <Severity
                name="MEDIUM"
                count={counts.medium}
                type="medium"
                active={
                  filter === "MEDIUM"
                }
                onClick={() => {
  setFilter("MEDIUM");
  setExpanded(null);
  setAiResults({});
}}
              />


              <Severity
                name="LOW"
                count={counts.low}
                type="low"
                active={
                  filter === "LOW"
                }
                onClick={() => {
  setFilter("LOW");
  setExpanded(null);
  setAiResults({});
}}
              />

            </div>

          </div>

                </section>


        {/* SECRETS DETECTED */}

        <section className="secrets-panel">

          <div className="secrets-header">

            <div>

              <span className="eyebrow">
                SECRET DETECTION
              </span>

              <h2>
                Secrets Detected
              </h2>

              <p>
                Sensitive credentials found in source code.
                Values are masked for security.
              </p>

            </div>

            <strong>
              {
                data.securityIssues.filter(
                  (finding) =>
                   finding.type === "Exposed Secret" ||
finding.type === "Exposed Private Key" ||
finding.type === "API Key" ||
finding.type === "Access Token" ||
finding.type === "JWT Secret"
                ).length
              }
            </strong>

          </div>

          <div className="secrets-list">

            {data.securityIssues
              .filter(
                (finding) =>
                 finding.type === "Exposed Secret" ||
finding.type === "Exposed Private Key" ||
finding.type === "API Key" ||
finding.type === "Access Token" ||
finding.type === "JWT Secret"
              )
              .slice(0, 5)
              .map((finding, index) => (

                <div
                  className="secret-item"
                  key={`${finding.file}-${finding.line}-${index}`}
                >

                  <div className="secret-dot" />

                  <div className="secret-info">

  <strong>
    {finding.type}
  </strong>
  {finding.context === "TEST" && (
  <span className="test-badge">
    TEST CODE
  </span>
)}

  <span>
    {finding.file}:{finding.line}
  </span>

  {finding.sourceCode && (
  <pre className="secret-code">
    {finding.sourceCode
      .split("\n")
      .map((sourceLine, i) => {
        const lineNumber = parseInt(
          sourceLine.trim().split(":")[0],
          10
        );

        const isMainLine =
          lineNumber === Number(finding.line);

        return (
          <span
            key={i}
            className={
              isMainLine
                ? "secret-main-line"
                : ""
            }
          >
            {sourceLine}
            {"\n"}
          </span>
        );
      })}
  </pre>
)}

</div>

                  <span
                    className={`secret-severity ${
                      String(
                        finding.severity || "HIGH"
                      ).toLowerCase()
                    }`}
                  >
                    {finding.severity || "HIGH"}
                  </span>

                </div>

              ))}

          </div>

          <div className="secret-safe-note">
            🔒 Secret values are masked and never displayed.
          </div>

        </section>


        {/* FINDINGS */}

        <section className="findings-panel">

          <div className="findings-heading">

            <div>

              <span className="eyebrow">
                PRIORITIZED RESULTS
              </span>

              <h2>
                Top 10 Security Findings
              </h2>

              <p>
                Highest-priority findings
                appear first.
              </p>

            </div>


            <div className="filters">

  {[
    "ALL",
    "HIGH",
    "MEDIUM",
    "LOW",
  ].map((item) => (

    <button
      key={item}
      className={
        filter === item
          ? "active"
          : ""
      }
      onClick={() => {
        setFilter(item);
        setExpanded(null);
        setAiResults({});
        setCurrentPage(1);
      }}
    >
      {item}
    </button>

  ))}

</div>

          </div>
          


          <div className="findings-list">

            {findings.length === 0 ? (

              <div className="no-findings">
                ✓ No findings for this filter
              </div>

            ) : (

              paginatedFindings.map(
                (finding, index) => {

                  const isOpen =
                    expanded === index;

                  return (
                    <div
                      className={
                        isOpen
                          ? "finding open"
                          : "finding"
                      }
                      key={
                        `${finding.type}-${finding.file}-${finding.line}-${index}`
                      }
                    >

                      <div
                        className="finding-row"
                        onClick={() =>
                          setExpanded(
                            isOpen
                              ? null
                              : index
                          )
                        }
                      >

                        <div className="finding-index">

                          {String(
                            index + 1
                          ).padStart(2, "0")}

                        </div>
                        


                        <div
                          className={`finding-dot ${
                            String(
                              finding.severity ||
                                "LOW"
                            ).toLowerCase()
                          }`}
                        />


                        <div className="finding-info">

                          <div className="finding-name">

                            {finding.type ||
                              "Security Finding"}

                            <span
                              className={`tag ${
                                String(
                                  finding.severity ||
                                    "LOW"
                                ).toLowerCase()
                              }`}
                            >

                              {finding.severity ||
                                "LOW"}

                            </span>

                          </div>


                          <div className="finding-location">

                            {finding.file ||
                              "Unknown file"}

                            :

                            {finding.line ||
                              "?"}

                            {finding.owasp && (
                              <>
                                {" • "}
                                {finding.owasp}
                              </>
                            )}

                          </div>

                        </div>


                        <div className="confidence">

                          <small>
                            CONFIDENCE
                          </small>

                          <strong>
                            {finding.confidence ??
                              0}
                            %
                          </strong>

                        </div>


                        <div className="expand">

                          {isOpen
                            ? "−"
                            : "+"}

                        </div>

                      </div>


                      {isOpen && (

  <div className="finding-details">

    <div>

      <label>
        WHY IT MATTERS
      </label>

      <p>
        {finding.message ||
          "No description available."}
      </p>

    </div>


    <div className="recommended-fix-section">

  <label>
    RECOMMENDED FIX
  </label>

  <p>
    {finding.recommendation ||
      "Review and remediate this finding."}
  </p>

  <div className="ai-actions">

    <button
  className="ai-button"
  onClick={(e) => {
    e.stopPropagation();

    explainWithAI(
      finding,
      index
    );
  }}
  disabled={aiLoading === index}
>
  {aiLoading === index ? (
    <>
      <span className="ai-spinner"></span>
      AI is analyzing...
    </>
  ) : (
    "✦ Explain with AI"
  )}
</button>


    <button
  className="ai-button"
  onClick={(e) => {
    e.stopPropagation();

    fixWithAI(
      finding,
      index
    );
  }}
  disabled={fixLoading === index}
>
  {fixLoading === index ? (
    <>
      <span className="ai-spinner"></span>
      AI is generating the fix...
    </>
  ) : (
    "✦ Fix with AI"
  )}
</button>
    

  </div>

</div>
{(finding.sourceCode ||
  finding.code ||
  finding.snippet ||
  finding.source) && (
  <div className="vulnerable-code-section">

    <label>
      VULNERABLE CODE
    </label>

    <div className="code-preview">
  {(finding.sourceCode ||
    finding.code ||
    finding.snippet ||
    finding.source)
    .split("\n")
    .map((line, lineIndex) => {
      const match = line.match(/^\s*(\d+):/);

const displayedLine = match
  ? Number(match[1])
  : lineIndex + 1;

const isVulnerable =
  displayedLine === Number(finding.line);

      return (
        <div
          key={lineIndex}
          className={
            isVulnerable
              ? "code-line vulnerable"
              : "code-line"
          }
        >
          <span className="line-number">
            {displayedLine}
          </span>

          <span className="line-code">
  {line.replace(/^\s*\d+:\s*/, "")}
</span>
        </div>
      );
    })}
</div>

  </div>
)}

{(aiLoading === index || fixLoading === index) && (
  <div className="ai-working">
    <div className="ai-working-icon">
      ✦
    </div>

    <div className="ai-working-content">
      <strong>
  {fixLoading === index
    ? "AI SECURITY FIX IN PROGRESS"
    : "AI SECURITY ANALYSIS IN PROGRESS"}
</strong>

<p>
  {fixLoading === index
    ? "Groq is generating a secure replacement for the vulnerable code."
    : "Groq is analyzing the vulnerability and preparing a security recommendation."}
</p>

      <div className="ai-working-bar">
        <div className="ai-working-bar-fill" />
      </div>

      <small>
        This may take a few seconds. Please don't close or refresh the page.
      </small>
    </div>
  </div>
)}


    
   



    {aiResults[index] && (

      <div className="ai-result">

        {aiResults[index].error ? (

          <div>

            <label>
              AI ANALYSIS ERROR
            </label>

            <p>
              {aiResults[index].error}
            </p>

          </div>

        ) : (

          <>

            <div>

              <label>
                AI ASSESSMENT
              </label>

              <p>
                {aiResults[index].explanation ||
                  "No explanation returned."}
              </p>

            </div>


            <div>

              <label>
                ROOT CAUSE
              </label>

              <p>
                {aiResults[index].rootCause ||
                  "No root cause identified."}
              </p>

            </div>


            <div>

              <label>
                SECURITY IMPACT
              </label>

              <p>
                {aiResults[index].impact ||
                  "No impact information returned."}
              </p>

            </div>


            <div>

              <label>
                AI CONFIDENCE
              </label>

              <p>
                {aiResults[index].confidence ?? 0}%
              </p>

            </div>


            {aiResults[index].secureCode && (

              <div>

                <label>
                  SECURE CODE
                </label>

                <pre>
                  {aiResults[index].secureCode}
                </pre>

              </div>

            )}

          </>

        )}

      </div>

    )}
   {fixResults[getFindingKey(finding)] && (

  <div className="ai-fix-result">

    {fixResults[getFindingKey(finding)].error ? (

      <div>
        <label>
          ✦ AI FIX 
        </label>

        <p>
  {fixResults[getFindingKey(finding)].error}
</p>
      </div>

    ) : (

      <>

        <div>
          <label>
            AI FIX
          </label>

          <pre>
            {fixResults[getFindingKey(finding)].fixedCode}
          </pre>
        </div>

        <div>
          <label>
            WHY THIS FIX WORKS
          </label>

          <p>
            {fixResults[getFindingKey(finding)].explanation}
          </p>
        </div>

        {fixResults[getFindingKey(finding)].changes && (

          <div>
            <label>
              CHANGES MADE
            </label>

            <ul>
              {fixResults[getFindingKey(finding)].changes.map(
                (change, changeIndex) => (
                  <li key={changeIndex}>
                    {change}
                  </li>
                )
              )}
            </ul>
          </div>

        )}

        <button
  className="ai-button"
  onClick={(e) => {
    e.stopPropagation();

    copyFix(
  fixResults[getFindingKey(finding)].fixedCode,
  index
);
  }}
>
  {copiedFix === index
    ? "✓ Copied!"
    : "⧉ Copy Fix"}
</button>
<button
  className="ai-button"
  onClick={(e) => {
    e.stopPropagation();

    applyFix(
      finding,
      index
    );
  }}
  disabled={
    fixLoading === index ||
    verifyResults[index]?.applied
  }
>
  {fixLoading === index
    ? "✓ Applying..."
    : verifyResults[index]?.applied
      ? "✓ Fix Applied"
      : "✓ Apply Fix"}
</button>

<button
  className="ai-button"
  onClick={(e) => {
    e.stopPropagation();

    verifyFinding(
      finding,
      index
    );
  }}
  disabled={
    verifyLoading === index
  }
>
  {verifyLoading === index
    ? "↻ Rescanning..."
    : "↻ Verify Fix"}
</button>
{verifyResults[index] && (

  <div className="ai-fix-result">

    {verifyResults[index].error ? (

      <div>
        <label>
          VERIFICATION ERROR
        </label>

        <p>
          {verifyResults[index].error}
        </p>
      </div>

    ) : verifyResults[index].verified ? (

      <div>
        <label>
          ✓ FIX VERIFIED
        </label>

       <div>

  <label>
    ✓ FIX VERIFIED
  </label>

  <p>
    {verifyResults[index].finding}
    {" "}has been successfully resolved.
  </p>

  {verifyResults[index]?.verified && analysis && (

  <p>
    Security findings reduced to{" "}
    <strong>
      {analysis.securityIssues?.length ?? 0}
    </strong>.
  </p>

)}
</div>
      </div>

    ) : (

      <div>
        <label>
           FIX VERIFIED
        </label>

        <p>
          The vulnerability is not present
          after rescanning the project.
        </p>
      </div>

    )}

  </div>

)}


      </>

    )}

  </div>

)}

  </div>

)}

          </div>
                  );
                }
              )

                        )}

          </div>


          {/* PAGINATION */}

          {findings.length > findingsPerPage && (

            <div className="pagination">

              <button
                className="pagination-button"
                disabled={currentPage === 1}
                onClick={() => {
                  setCurrentPage(
                    currentPage - 1
                  );

                  setExpanded(null);

                  setAiResults({});
                }}
              >
                ← Previous
              </button>


              <div className="page-numbers">

                {Array.from(
                  { length: totalPages },
                  (_, index) => {

                    const page =
                      index + 1;

                    return (
                      <button
                        key={page}
                        className={
                          currentPage === page
                            ? "active"
                            : ""
                        }
                        onClick={() => {
                          setCurrentPage(page);
                          setExpanded(null);
                          setAiResults({});
                        }}
                      >
                        {page}
                      </button>
                    );

                  }
                )}

              </div>


              <button
                className="pagination-button"
                disabled={
                  currentPage === totalPages
                }
                onClick={() => {
                  setCurrentPage(
                    currentPage + 1
                  );

                  setExpanded(null);

                  setAiResults({});
                }}
              >
                Next →
              </button>

            </div>

          )}

        </section>
        {/* =================================================
    REMEDIATION RESULTS
    ================================================= */}

{Object.keys(remediationResults).length > 0 && (

  <section className="remediation-panel">

    <div className="remediation-panel-header">

      <div>

        <span className="eyebrow">
          AI REMEDIATION
        </span>

        <h2>
          Fix Results
        </h2>

        <p>
          Security posture before and after applying AI fixes.
        </p>

      </div>

    </div>


    <div className="remediation-list">

     {Object.entries(remediationResults).map(
  ([findingKey, remediation]) => (

    <div
      className="remediation-result"
      key={findingKey}
    >

            <div className="remediation-title">
              REMEDIATION RESULT
            </div>

            <h3>
              {remediation.finding}
            </h3>


            <div className="remediation-comparison">


              {/* BEFORE */}

              <div className="remediation-before">

                <span>
                  BEFORE
                </span>

                <strong>
                  {remediation.beforeIssues}
                </strong>

                <p>
                  Security vulnerabilities
                </p>

                <p>
                  Risk Score:{" "}
                  {remediation.beforeRisk}
                </p>

              </div>


              {/* AI FIX */}

              <div className="remediation-arrow">

                ↓

                <small>
                  AI FIX
                </small>

              </div>


              {/* AFTER */}

              <div className="remediation-after">

                <span>
                  AFTER
                </span>

                <strong>
                  {remediation.afterIssues ?? "—"}
                </strong>

                <p>
                  Security vulnerabilities
                </p>

                <p>
                  Risk Score:{" "}
                  {remediation.afterRisk ?? "—"}
                </p>

              </div>

            </div>


            {/* STATUS */}

            {remediation.verified ? (

              <div className="remediation-success">
                ✓ Vulnerability resolved
              </div>

            ) : (

              <div className="remediation-failed">
                ⏳ Waiting for verification
              </div>

            )}

          </div>

        )
      )}

    </div>

  </section>

)}


        {/* OWASP */}

        {Object.keys(
          data.owaspSummary
        ).length > 0 && (

          <section className="owasp-panel">

            <span className="eyebrow">
              SECURITY STANDARD
            </span>

            <h2>
              OWASP Coverage
            </h2>


            <div className="owasp-grid">

              {Object.entries(
                data.owaspSummary
              ).map(
                ([name, count]) => (

                  <div
                    className="owasp-item"
                    key={name}
                  >

                    <span>
                      {name}
                    </span>

                    <strong>
                      {count}
                    </strong>

                  </div>

                )
              )}

            </div>

          </section>

        )}


        {/* QUALITY */}

        <section className="quality-panel">

          <div>

            <span className="eyebrow">
              CODE QUALITY
            </span>

            <h2>
              {data.qualityIssues.length}
              {" "}
              Quality Findings
            </h2>

            <p>
              Maintainability and code-quality
              observations from the scan.
            </p>

          </div>


          <strong>
            {data.qualityIssues.length}
          </strong>

        </section>


        {/* =================================================
            BOTTOM DOWNLOAD REPORT
            ================================================= */}

        <div className="bottom-report">

          <div className="bottom-report-info">

            <div className="bottom-report-icon">
              ↓
            </div>

            <div>

              <h3>
                Security Report Ready
              </h3>

              <p>
                Download a complete CodeSentinel
                security analysis report.
              </p>

            </div>

          </div>


          <button
            className="bottom-download-button"
            onClick={downloadReport}
          >

            <span className="download-arrow">
              ↓
            </span>

            Download Report

          </button>

        </div>


        {/* FOOTER */}

        <footer>

          <span>
            CodeSentinel
          </span>

          <span>
            Intelligent Code Security Platform
          </span>

        </footer>

      </main>

    </div>
  );
}


/* =========================================================
   SCAN STEP
   ========================================================= */

function ScanStep({
  label,
  active,
  complete,
}) {
  
;
  return (
    <div
      className={
        complete
          ? "scan-step complete"
          : active
          ? "scan-step active"
          : "scan-step"
      }
    >

      <span className="step-indicator">

        {complete
          ? "✓"
          : active
          ? "●"
          : "○"}

      </span>

      <span>
        {label}
      </span>

      <b>

        {complete
          ? "COMPLETE"
          : active
          ? "ACTIVE"
          : "WAITING"}

      </b>

    </div>
  );
}


/* =========================================================
   METRIC
   ========================================================= */

function Metric({
  title,
  value,
  icon,
  special,
}) {
  return (
    <div
      className={
        special
          ? "metric special"
          : "metric"
      }
    >

      <div className="metric-top">

        <span>
          {title}
        </span>

        <b>
          {icon}
        </b>

      </div>


      <strong>

        {Number.isFinite(value)
          ? Number(value).toLocaleString()
          : value}

      </strong>

    </div>
  );
}


/* =========================================================
   SEVERITY
   ========================================================= */

function Severity({
  name,
  count,
  type,
  active,
  onClick,
}) {
  return (
    <button
      className={
        active
          ? `severity ${type} selected`
          : `severity ${type}`
      }
      onClick={onClick}
    >

      <span className="severity-light" />

      <div>

        <small>
          {name}
        </small>

        <strong>
          {count}
        </strong>

      </div>

    </button>
  );
}


export default App;