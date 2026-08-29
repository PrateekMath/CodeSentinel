require("dotenv").config();

const {
  analyzeSecurityFinding,
  generateAIFix,
} = require("./aiService");
const simpleGit = require("simple-git");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const unzipper = require("unzipper");
const fs = require("fs");
const path = require("path");

const { analyzeProject } = require("../analyzer/analyzer");

const app = express();


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());
app.use(express.json());


// =====================================================
// UPLOAD CONFIGURATION
// =====================================================

const upload = multer({
    dest: path.join(__dirname, "uploads")
});


// =====================================================
// CREATE UPLOAD DIRECTORY
// =====================================================

const uploadsDirectory =
    path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDirectory)) {

    fs.mkdirSync(
        uploadsDirectory,
        {
            recursive: true
        }
    );
}


// =====================================================
// GITHUB URL VALIDATION
// =====================================================

function isValidGitHubUrl(repoUrl) {

    const githubPattern =
        /^https?:\/\/github\.com\/[^/]+\/[^/]+\/?$/;

    return githubPattern.test(
        repoUrl.trim()
    );
}


// =====================================================
// CLONE GITHUB REPOSITORY
// =====================================================

async function cloneGitHubRepository(repoUrl) {

    const cleanUrl =
        repoUrl
            .trim()
            .replace(/\/$/, "");

    const repoName =
        cleanUrl
            .split("/")
            .filter(Boolean)
            .pop()
            .replace(".git", "");

    const clonePath =
        path.join(
            uploadsDirectory,
            `github-${Date.now()}-${repoName}`
        );


    console.log("");
    console.log("====================================");
    console.log("        GITHUB CLONE STARTED");
    console.log("====================================");

    console.log(
        "Repository:",
        cleanUrl
    );

    console.log(
        "Destination:",
        clonePath
    );

    console.log("");


    try {

        const git =
            simpleGit();


        await git.clone(
            cleanUrl,
            clonePath
        );


        console.log(
            "✓ Repository cloned successfully"
        );

        console.log(
            "Path:",
            clonePath
        );

        console.log("");


        return clonePath;

    } catch (error) {

        console.error("");
        console.error(
            "✗ Git clone failed"
        );

        console.error(
            "Error:",
            error.message
        );

        console.error("");


        // Remove partially cloned folder
        if (
            fs.existsSync(clonePath)
        ) {

            try {

                fs.rmSync(
                    clonePath,
                    {
                        recursive: true,
                        force: true
                    }
                );

            } catch (cleanupError) {

                console.error(
                    "Cleanup error:",
                    cleanupError.message
                );
            }
        }


        throw new Error(
            `GitHub clone failed: ${error.message}`
        );
    }
}


// =====================================================
// REMOVE DIRECTORY
// =====================================================

function removeDirectory(directoryPath) {

    if (
        !directoryPath ||
        !fs.existsSync(directoryPath)
    ) {
        return;
    }


    try {

        fs.rmSync(
            directoryPath,
            {
                recursive: true,
                force: true
            }
        );

        console.log(
            "Temporary folder removed:",
            directoryPath
        );

    } catch (error) {

        console.error(
            "Could not remove folder:",
            error.message
        );
    }
}


// =====================================================
// ROOT ROUTE
// =====================================================

app.get("/", (req, res) => {

    res.json({

        message:
            "CodeSentinel Backend is running"

    });
});


// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/api/health", (req, res) => {

    res.json({

        status: "OK"

    });
});


// =====================================================
// ZIP PROJECT ANALYSIS
// =====================================================

app.post(
    "/api/analyze",
    upload.single("project"),
    async (req, res) => {

        let zipPath = null;
        let extractPath = null;


        try {

            // -----------------------------------------
            // CHECK FILE
            // -----------------------------------------

            if (!req.file) {

                return res.status(400).json({

                    error:
                        "No project ZIP file uploaded"

                });
            }


            console.log("");
            console.log(
                "===================================="
            );

            console.log(
                "       ZIP PROJECT ANALYSIS"
            );

            console.log(
                "===================================="
            );


            console.log(
                "Uploaded file:",
                req.file.originalname
            );


            zipPath =
                req.file.path;


            // -----------------------------------------
            // PROJECT NAME
            // -----------------------------------------

            const projectName =
                path
                    .parse(
                        req.file.originalname
                    )
                    .name
                    .replace(
                        /[^a-zA-Z0-9_-]/g,
                        "-"
                    );


            extractPath =
                path.join(
                    uploadsDirectory,
                    `${projectName}-${Date.now()}`
                );


            // -----------------------------------------
            // CREATE EXTRACTION DIRECTORY
            // -----------------------------------------

            fs.mkdirSync(
                extractPath,
                {
                    recursive: true
                }
            );


            console.log(
                "Extracting project..."
            );


            // -----------------------------------------
            // EXTRACT ZIP
            // -----------------------------------------

            await fs
                .createReadStream(zipPath)
                .pipe(
                    unzipper.Extract({
                        path: extractPath
                    })
                )
                .promise();


            console.log(
                "Project extracted to:",
                extractPath
            );


            // -----------------------------------------
            // ANALYZE PROJECT
            // -----------------------------------------

            console.log(
                "Starting code analysis..."
            );


            const analysis =
                analyzeProject(
                    extractPath
                );


            console.log(
                "✓ Analysis completed"
            );


            // -----------------------------------------
            // RESPONSE
            // -----------------------------------------

            res.json({

                message:
                    "Project analyzed successfully",

                filename:
                    req.file.originalname,

                projectPath:
                    extractPath,

                analysis:
                    analysis

            });


            // -----------------------------------------
            // CLEAN TEMP FILES
            // -----------------------------------------

            if (
                zipPath &&
                fs.existsSync(zipPath)
            ) {

                fs.unlinkSync(
                    zipPath
                );
            }


            // NOTE:
            // We keep extractPath because the analyzer
            // or frontend may still use it.
            //
            // If you don't need it later, we can also
            // remove it after analysis.


        } catch (error) {

            console.error("");
            console.error(
                "ZIP analysis error:"
            );

            console.error(
                error
            );


            // Cleanup ZIP

            if (
                zipPath &&
                fs.existsSync(zipPath)
            ) {

                try {

                    fs.unlinkSync(
                        zipPath
                    );

                } catch (cleanupError) {

                    console.error(
                        cleanupError.message
                    );
                }
            }


            // Cleanup extracted project

            if (
                extractPath &&
                fs.existsSync(extractPath)
            ) {

                removeDirectory(
                    extractPath
                );
            }


            res.status(500).json({

                error:
                    error.message ||
                    "Failed to analyze project"

            });
        }
    }
);


// =====================================================
// GITHUB PROJECT ANALYSIS
// =====================================================

app.post(
    "/api/analyze-github",
    async (req, res) => {

        let projectPath = null;


        try {

            const {
                repoUrl
            } = req.body;


            // -----------------------------------------
            // CHECK URL
            // -----------------------------------------

            if (!repoUrl) {

                return res.status(400).json({

                    message:
                        "GitHub repository URL is required"

                });
            }


            const cleanUrl =
                repoUrl
                    .trim()
                    .replace(
                        /\/$/,
                        ""
                    );


            // -----------------------------------------
            // VALIDATE URL
            // -----------------------------------------

            if (
                !isValidGitHubUrl(
                    cleanUrl
                )
            ) {

                return res.status(400).json({

                    message:
                        "Please provide a valid GitHub repository URL. Example: https://github.com/user/repository"

                });
            }


            console.log("");
            console.log(
                "===================================="
            );

            console.log(
                "      GITHUB PROJECT ANALYSIS"
            );

            console.log(
                "===================================="
            );

            console.log(
                "GitHub repository:",
                cleanUrl
            );

            console.log("");


            // -----------------------------------------
            // CLONE
            // -----------------------------------------

            projectPath =
                await cloneGitHubRepository(
                    cleanUrl
                );


            console.log(
                "Repository cloned to:",
                projectPath
            );


            // -----------------------------------------
            // ANALYZE
            // -----------------------------------------

            console.log(
                "Starting repository analysis..."
            );


            const analysis =
                analyzeProject(
                    projectPath
                );


            console.log(
                "✓ GitHub analysis completed"
            );


            // -----------------------------------------
            // RESPONSE
            // -----------------------------------------

            res.json({

                message:
                    "GitHub repository analyzed successfully",

                projectPath:
                    projectPath,

                analysis:
                    analysis

            });


            // -----------------------------------------
            // CLEAN CLONED REPOSITORY
            // -----------------------------------------

            //removeDirectory(
           //     projectPath
            //);


        } catch (error) {

            console.error("");
            console.error(
                "===================================="
            );

            console.error(
                "      GITHUB ANALYSIS ERROR"
            );

            console.error(
                "===================================="
            );

            console.error(
                error.message
            );

            console.error("");


            // -----------------------------------------
            // CLEANUP
            // -----------------------------------------

            if (
                projectPath
            ) {

                removeDirectory(
                    projectPath
                );
            }


            res.status(500).json({

                message:
                    "Failed to analyze GitHub repository",

                error:
                    error.message

            });
        }
    }
);


// =====================================================
// 404 HANDLER
// =====================================================
app.post("/api/ai/explain", async (req, res) => {
  try {
    const { finding, sourceCode } = req.body;

    if (!finding) {
      return res.status(400).json({
        success: false,
        message: "Security finding is required.",
      });
    }

    console.log("====================================");
    console.log("       GROQ AI ANALYSIS");
    console.log("====================================");

    const result = await analyzeSecurityFinding({
      finding,
      sourceCode,
    });

    console.log("✓ Groq analysis completed");

    res.json({
      success: true,
      ai: result,
    });

  } catch (error) {
    console.error("Groq AI error:", error);

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Groq AI analysis failed.",
    });
  }
});
// =====================================================
// AI FIX ENDPOINT
// =====================================================

// =====================================================
// AI FIX ENDPOINT
// =====================================================

// =====================================================
// AI FIX ENDPOINT
// =====================================================

app.post("/api/ai/fix", async (req, res) => {
  try {
    const {
      finding,
      sourceCode = "",
    } = req.body;

    if (!finding) {
      return res.status(400).json({
        success: false,
        message:
          "Security finding is required.",
      });
    }

    console.log("====================================");
    console.log("          AI SECURITY FIX");
    console.log("====================================");

    const prompt = `
You are CodeSentinel AI, an expert application security engineer.

Generate a practical and secure fix for the security finding below.

SECURITY FINDING:
${JSON.stringify(finding, null, 2)}

SOURCE CODE:
${sourceCode || "No source code was provided."}

Your task:

1. Identify the vulnerable code.
2. Generate corrected secure code.
3. Explain why the fix works.
4. List the changes made.

Return ONLY valid JSON in exactly this format:

{
  "fixedCode": "",
  "explanation": "",
  "changes": []
}

Rules:
- Use the supplied source code as evidence.
- Do not invent facts.
- Preserve the original programming language.
- Make the smallest practical security change.
- Do not remove legitimate functionality.
- If there is not enough source code to safely create a fix, say so.
- "changes" must be an array of strings.
`;

    console.log(
      "AI fix prompt length:",
      prompt.length
    );

    const result =
      await generateAIFix(prompt);

    console.log(
      "✓ Groq AI fix completed"
    );

    res.json({
      success: true,
      fix: result,
    });

  } catch (error) {

    console.error(
      "Groq AI fix error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Groq is temporarily unavailable. Please try again in a few seconds.",
    });
  }
});

// =====================================================
// VERIFY SECURITY FIX
// =====================================================

app.post("/api/verify-fix", async (req, res) => {

  try {

    const {
      projectPath,
      finding
    } = req.body;

    if (!projectPath) {

      return res.status(400).json({
        success: false,
        message: "Project path is required."
      });

    }

    if (!finding) {

      return res.status(400).json({
        success: false,
        message: "Security finding is required."
      });

    }

    // Security check:
    // Only allow verification inside our uploads directory.
    const resolvedProject =
      path.resolve(projectPath);

    const resolvedUploads =
      path.resolve(uploadsDirectory);

    if (
      resolvedProject !== resolvedUploads &&
      !resolvedProject.startsWith(
        resolvedUploads + path.sep
      )
    ) {

      return res.status(403).json({
        success: false,
        message: "Invalid project path."
      });

    }

    if (!fs.existsSync(resolvedProject)) {

      return res.status(404).json({
        success: false,
        message: "Project is no longer available."
      });

    }

    console.log("");
    console.log("====================================");
    console.log("          VERIFY SECURITY FIX");
    console.log("====================================");

    console.log(
      "Project:",
      resolvedProject
    );

    console.log(
      "Finding:",
      finding.type
    );

    // Re-run CodeSentinel
    const analysis =
      analyzeProject(
        resolvedProject
      );

    // Look for the same vulnerability type
    const remainingFinding =
      analysis.securityIssues?.find(
        (issue) =>
          issue.type === finding.type &&
          issue.file === finding.file
      );

    const resolved =
      !remainingFinding;

    console.log(
      resolved
        ? "✓ FINDING RESOLVED"
        : "✗ FINDING STILL PRESENT"
    );

    res.json({

      success: true,

      verified: resolved,

      finding: finding.type,

      remainingFinding:
        remainingFinding || null,

      analysis: analysis

    });

  } catch (error) {

    console.error(
      "Verify fix error:",
      error
    );

    res.status(500).json({

      success: false,

      message:
        error.message ||
        "Fix verification failed."

    });

  }

});

// =====================================================
// APPLY AI SECURITY FIX
// =====================================================

app.post("/api/apply-fix", async (req, res) => {

  try {

    const {
      projectPath,
      finding,
      fixedCode
    } = req.body;

    if (!projectPath) {
      return res.status(400).json({
        success: false,
        message: "Project path is required."
      });
    }

    if (!finding) {
      return res.status(400).json({
        success: false,
        message: "Security finding is required."
      });
    }

    if (!fixedCode) {
      return res.status(400).json({
        success: false,
        message: "Fixed code is required."
      });
    }

    // -------------------------------------------------
    // SECURITY: PROJECT MUST BE INSIDE UPLOADS
    // -------------------------------------------------

    const resolvedProject =
      path.resolve(projectPath);

    const resolvedUploads =
      path.resolve(uploadsDirectory);

    if (
      resolvedProject !== resolvedUploads &&
      !resolvedProject.startsWith(
        resolvedUploads + path.sep
      )
    ) {

      return res.status(403).json({
        success: false,
        message: "Invalid project path."
      });

    }

    // -------------------------------------------------
    // SECURITY: VALIDATE FINDING FILE PATH
    // -------------------------------------------------

    const relativeFile =
      String(finding.file || "")
        .replace(/\\/g, "/")
        .replace(/^\/+/, "");

    if (!relativeFile) {

      return res.status(400).json({
        success: false,
        message: "Finding file path is required."
      });

    }

    const filePath =
      path.resolve(
        resolvedProject,
        relativeFile
      );

    if (
      !filePath.startsWith(
        resolvedProject + path.sep
      )
    ) {

      return res.status(403).json({
        success: false,
        message: "Invalid finding file path."
      });

    }

    if (!fs.existsSync(filePath)) {

      return res.status(404).json({
        success: false,
        message:
          "Finding source file could not be found."
      });

    }

    // -------------------------------------------------
    // READ SOURCE
    // -------------------------------------------------

    const originalCode =
      fs.readFileSync(
        filePath,
        "utf8"
      );

    const lines =
      originalCode.split("\n");

    const lineNumber =
      Number(finding.line);

    if (
      !Number.isInteger(lineNumber) ||
      lineNumber < 1 ||
      lineNumber > lines.length
    ) {

      return res.status(400).json({
        success: false,
        message:
          "Finding line number is invalid."
      });

    }

    // -------------------------------------------------
    // CLEAN AI CODE
    // -------------------------------------------------

    let cleanFixedCode =
      String(fixedCode).trim();

    // Remove markdown code fences if Groq returned them.
    cleanFixedCode =
      cleanFixedCode
        .replace(/^```[a-zA-Z0-9_-]*\s*/, "")
        .replace(/\s*```$/, "")
        .trim();

    if (!cleanFixedCode) {

      return res.status(400).json({
        success: false,
        message:
          "AI returned empty fixed code."
      });

    }

    // -------------------------------------------------
    // CREATE BACKUP OUTSIDE PROJECT
    // -------------------------------------------------

    const backupRoot =
      path.join(
        uploadsDirectory,
        ".codesentinel-backups"
      );

    fs.mkdirSync(
      backupRoot,
      { recursive: true }
    );

    const backupName =
      `${Date.now()}-${path.basename(filePath)}`;

    const backupPath =
      path.join(
        backupRoot,
        backupName
      );

    fs.writeFileSync(
      backupPath,
      originalCode,
      "utf8"
    );

    // -------------------------------------------------
    // APPLY FIX
    // -------------------------------------------------

    const originalLine =
      lines[lineNumber - 1];

    lines[lineNumber - 1] =
      cleanFixedCode;

    const updatedCode =
      lines.join("\n");

    fs.writeFileSync(
      filePath,
      updatedCode,
      "utf8"
    );

    console.log("");
    console.log("====================================");
    console.log("          AI FIX APPLIED");
    console.log("====================================");
    console.log(
      "Finding:",
      finding.type
    );
    console.log(
      "File:",
      relativeFile
    );
    console.log(
      "Line:",
      lineNumber
    );
    console.log(
      "Backup:",
      backupPath
    );
    console.log(
      "✓ Source file updated"
    );

    res.json({

      success: true,

      message:
        "AI fix applied successfully.",

      file:
        relativeFile,

      line:
        lineNumber,

      originalCode:
        originalLine,

      fixedCode:
        cleanFixedCode

    });

  } catch (error) {

    console.error(
      "Apply AI fix error:",
      error
    );

    res.status(500).json({

      success: false,

      message:
        error.message ||
        "Failed to apply AI fix."

    });

  }

});
// =====================================================
// ERROR HANDLER
// =====================================================

app.use(
    (error, req, res, next) => {

        console.error(
            "Server error:",
            error
        );

        res.status(500).json({

            error:
                error.message ||
                "Internal server error"

        });
    }
);


// =====================================================
// START SERVER
// =====================================================

const PORT = process.env.PORT || 5000;


app.listen(
    PORT,
    () => {

        console.log("");
        console.log(
            "===================================="
        );

        console.log(
            "      CODESENTINEL BACKEND"
        );

        console.log(
            "===================================="
        );

        console.log(
            `Server running on port ${PORT}`
        );

        console.log(
            `http://localhost:${PORT}`
        );

        console.log("");
    }
);