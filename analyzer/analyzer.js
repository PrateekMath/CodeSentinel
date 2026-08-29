const fs = require("fs");
const path = require("path");

// =====================================================
// CODE SENTINEL - STATIC CODE ANALYZER
// =====================================================

// -----------------------------------------------------
// DIRECTORIES TO IGNORE
// -----------------------------------------------------

const IGNORED_DIRECTORIES = new Set([
    "node_modules",
    ".git",
    "dist",
    "build",
    "coverage",
    ".next",
    ".nuxt",
    ".cache",
    "out",
    "target",
    "bin",
    "obj",
    "vendor",
    "venv",
    ".venv",
    "__pycache__",
    ".idea",
    ".vscode",
    "uploads",
    "tmp",
    "temp"
]);


// -----------------------------------------------------
// SUPPORTED SOURCE FILES
// -----------------------------------------------------

const SUPPORTED_EXTENSIONS = new Set([
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".py",
    ".java",
    ".c",
    ".cpp",
    ".h",
    ".hpp",
    ".cs",
    ".go",
    ".php",
    ".rb",
    ".rs",
    ".swift",
    ".kt",
    ".kts"
]);


// -----------------------------------------------------
// FILES TO IGNORE
// -----------------------------------------------------

const IGNORED_FILES = new Set([
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "composer.lock",
    "Gemfile.lock",
    "Podfile.lock"
]);


// -----------------------------------------------------
// MAX FILE SIZE
// -----------------------------------------------------

const MAX_FILE_SIZE = 1 * 1024 * 1024;


// =====================================================
// TEST / EXAMPLE FILE DETECTION
// =====================================================

function isTestFile(filePath) {

    const normalized =
        filePath
            .replace(/\\/g, "/")
            .toLowerCase();

    return (
        normalized.includes("/test/") ||
        normalized.includes("/tests/") ||
        normalized.includes("/__tests__/") ||
        normalized.includes("/fixtures/") ||
        normalized.includes("/fixture/") ||
        normalized.includes("/mocks/") ||
        normalized.includes("/mock/") ||
        normalized.includes("/examples/") ||
        normalized.includes("/example/") ||
        normalized.endsWith(".test.js") ||
        normalized.endsWith(".test.jsx") ||
        normalized.endsWith(".test.ts") ||
        normalized.endsWith(".test.tsx") ||
        normalized.endsWith(".spec.js") ||
        normalized.endsWith(".spec.jsx") ||
        normalized.endsWith(".spec.ts") ||
        normalized.endsWith(".spec.tsx")
    );
}


// =====================================================
// SOURCE FILE DISCOVERY
// =====================================================

function getSourceFiles(directory) {

    const files = [];

    function walk(currentDirectory) {

        let entries;

        try {

            entries = fs.readdirSync(
                currentDirectory,
                {
                    withFileTypes: true
                }
            );

        } catch (error) {

            console.error(
                "Unable to read:",
                currentDirectory
            );

            return;
        }


        for (const entry of entries) {

            const fullPath =
                path.join(
                    currentDirectory,
                    entry.name
                );


            // -----------------------------------------
            // DIRECTORY
            // -----------------------------------------

            if (entry.isDirectory()) {

                if (
                    IGNORED_DIRECTORIES.has(
                        entry.name
                    )
                ) {
                    continue;
                }

                walk(fullPath);

                continue;
            }


            // -----------------------------------------
            // FILE
            // -----------------------------------------

            if (!entry.isFile()) {
                continue;
            }


            if (
                IGNORED_FILES.has(
                    entry.name
                )
            ) {
                continue;
            }


            const extension =
                path
                    .extname(
                        entry.name
                    )
                    .toLowerCase();


            if (
                !SUPPORTED_EXTENSIONS.has(
                    extension
                )
            ) {
                continue;
            }


            try {

                const stats =
                    fs.statSync(
                        fullPath
                    );


                if (
                    stats.size >
                    MAX_FILE_SIZE
                ) {

                    console.log(
                        `Skipping large file: ${fullPath}`
                    );

                    continue;
                }

            } catch {

                continue;
            }


            files.push(fullPath);
        }
    }


    walk(directory);

    return files;
}


// =====================================================
// READ FILE
// =====================================================

function readSourceFile(filePath) {

    try {

        return fs.readFileSync(
            filePath,
            "utf8"
        );

    } catch (error) {

        console.error(
            `Cannot read ${filePath}:`,
            error.message
        );

        return null;
    }
}


// =====================================================
// GET LINE NUMBER
// =====================================================

function getLineNumber(
    content,
    index
) {

    return (
        content
            .slice(0, index)
            .split("\n")
            .length
    );
}


// =====================================================
// GET LINE
// =====================================================

function getLine(
    content,
    lineNumber
) {

    const lines =
        content.split("\n");

    return (
        lines[lineNumber - 1] || ""
    ).trim();
}
// =====================================================
// GET SOURCE CODE CONTEXT FOR AI
// =====================================================

function getSourceSnippet(
    content,
    lineNumber,
    context = 4
) {

    const lines =
        content.split("\n");

    const targetLine =
        Number(lineNumber) || 1;

    const startLine =
        Math.max(
            1,
            targetLine - context
        );

    const endLine =
        Math.min(
            lines.length,
            targetLine + context
        );

    return lines
        .slice(
            startLine - 1,
            endLine
        )
        .map(
            (line, index) =>
                `${startLine + index}: ${line}`
        )
        .join("\n");
}


// =====================================================
// COMMENT CHECK
// =====================================================

function isCommentLine(line) {

    const trimmed =
        line.trim();

    return (
        trimmed.startsWith("//") ||
        trimmed.startsWith("#") ||
        trimmed.startsWith("*") ||
        trimmed.startsWith("/*") ||
        trimmed.startsWith("<!--")
    );
}


// =====================================================
// CREATE SECURITY ISSUE
// =====================================================

function createSecurityIssue({
    type,
    category,
    severity,
    confidence,
    context,
    owasp,
    file,
    line,
    message,
    recommendation
}) {

    return {
        type,
        category,
        severity,
        confidence,
        owasp,
        file,
        line,
        message,
        recommendation
    };
}


// =====================================================
// CREATE QUALITY ISSUE
// =====================================================

function createQualityIssue({
    type,
    severity,
    file,
    line,
    message,
    recommendation
}) {

    return {
        type,
        severity,
        file,
        line,
        message,
        recommendation
    };
}


// =====================================================
// SECURITY ANALYSIS
// =====================================================

function analyzeSecurity(
    content,
    relativeFile
) {

    const issues = [];

    const lines =
        content.split("\n");

    const testFile =
        isTestFile(relativeFile);
        const findingContext =
    testFile
        ? "TEST"
        : "PRODUCTION";


    // =================================================
// 1. HARDCODED PASSWORD
// =================================================

const passwordRegex =
    /\b(password|passwd|pwd)\s*[:=]\s*["'`][^"'`\n]{4,}["'`]/gi;

let match;

while (
    (match =
        passwordRegex.exec(content)) !== null
) {

    const line =
        getLineNumber(
            content,
            match.index
        );

    const lineText =
        getLine(
            content,
            line
        );

    // -----------------------------------------
    // IGNORE COMMENTS
    // -----------------------------------------

    if (
        isCommentLine(lineText)
    ) {
        continue;
    }
    // Ignore hardcoded credentials inside test files.
// Test suites commonly contain intentional fake credentials.
if (testFile) {
    continue;
}

    // -----------------------------------------
    // EXTRACT PASSWORD VALUE
    // -----------------------------------------

    const valueMatch =
        lineText.match(
            /\b(?:password|passwd|pwd)\s*[:=]\s*["'`]([^"'`\n]+)["'`]/i
        );

    const passwordValue =
        valueMatch
            ? valueMatch[1].trim()
            : "";

    // -----------------------------------------
    // IGNORE OBVIOUS PLACEHOLDERS
    // -----------------------------------------

    if (
        /^(password|passwd|pwd|secret|test|testing|example|sample|dummy|placeholder|changeme|yourpassword|your[_-]?password)$/i
            .test(passwordValue)
    ) {
        continue;
    }

    // -----------------------------------------
    // IGNORE VERY WEAK TEST VALUES
    // -----------------------------------------

    if (
        /^(123456|12345678|123456789|qwerty|admin|admin123|test123|password123)$/i
            .test(passwordValue)
    ) {
        continue;
    }

    // -----------------------------------------
    // REQUIRE A CREDENTIAL-LIKE VALUE
    // -----------------------------------------

    const looksLikeRealPassword =
    passwordValue.length >= 8 &&
    (
        (
            /[A-Z]/.test(passwordValue) &&
            /[a-z]/.test(passwordValue)
        ) ||
        (
            /[A-Za-z]/.test(passwordValue) &&
            /\d/.test(passwordValue)
        ) ||
        (
            /[A-Za-z0-9]/.test(passwordValue) &&
            /[^A-Za-z0-9]/.test(passwordValue)
        )
    );

    if (!looksLikeRealPassword) {
        continue;
    }

    // -----------------------------------------
    // CREATE FINDING
    // -----------------------------------------

    issues.push(
        createSecurityIssue({

            type:
                "Hardcoded Password",

            category:
                "SECRET",

            severity:
                "HIGH",

            confidence:
                testFile ? 82 : 97,

            context:
                findingContext,

            owasp:
                "A07 - Identification and Authentication Failures",

            file:
                relativeFile,

            line,

            message:
                "A password-like credential appears to be hardcoded in source code.",

            recommendation:
                "Move passwords to environment variables or a secure secrets manager."
        })
    );
}

    // =================================================
    // 2. EXPOSED API KEY / SECRET
    // =================================================

    const secretRegex =
        /\b(api[_-]?key|secret[_-]?key|access[_-]?token|auth[_-]?token)\s*[:=]\s*["'`][A-Za-z0-9_\-]{16,}["'`]/gi;


    while (
        (match =
            secretRegex.exec(
                content
            )) !== null
    ) {

        const line =
            getLineNumber(
                content,
                match.index
            );

        const lineText =
            getLine(
                content,
                line
            );


        if (
            isCommentLine(lineText)
        ) {
            continue;
        }


        // Ignore obvious placeholders.
        if (
            /your[_-]?api[_-]?key|your[_-]?token|example|placeholder|changeme|dummy/i
                .test(lineText)
        ) {
            continue;
        }
        const maskedCode = lineText.replace(
    /(["'`])[^"'`]*\1/g,
    "$1••••••••••••$1"
);


        issues.push(
            createSecurityIssue({

                type:
                    "Exposed Secret",
                    category:
    "SECRET",
 
                    

                severity:
                    "HIGH",

                confidence:
                    testFile ? 85 : 95,

                owasp:
                    "A02 - Cryptographic Failures",

                file:
                    relativeFile,

                line,

                message:
                    "A possible API key, secret, or access token appears to be hardcoded.",

                recommendation:
                    "Remove the secret from source code and use environment variables or a secure secrets manager."
            })
        );
    }


    // =================================================
    // 3. PRIVATE KEY
    // =================================================

    const privateKeyRegex =
        /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/g;


    while (
        (match =
            privateKeyRegex.exec(
                content
            )) !== null
    ) {

        const line =
            getLineNumber(
                content,
                match.index
            );


        issues.push(
            createSecurityIssue({

                type:
                    "Exposed Private Key",
                    category:
    "SECRET",

                severity:
                    "HIGH",

                confidence:
                    99,

                owasp:
                    "A02 - Cryptographic Failures",

                file:
                    relativeFile,

                line,

                message:
                    "A private cryptographic key appears to be embedded in source code.",

                recommendation:
                    "Remove the private key and store it securely outside the repository."
            })
        );
    }


    // =================================================
    // 4. EVAL
    // =================================================

    const evalRegex =
        /\beval\s*\(/g;


    while (
        (match =
            evalRegex.exec(
                content
            )) !== null
    ) {

        const line =
            getLineNumber(
                content,
                match.index
            );

        const lineText =
            getLine(
                content,
                line
            );


        if (
            isCommentLine(lineText)
        ) {
            continue;
        }


        issues.push(
            createSecurityIssue({

                type:
                    "Dangerous eval()",

                severity:
                    "HIGH",

                confidence:
                    97,

                owasp:
                    "A03 - Injection",

                file:
                    relativeFile,

                line,

                message:
                    "eval() executes dynamically generated code and can introduce code injection vulnerabilities.",

                recommendation:
                    "Avoid eval() and use safer alternatives."
            })
        );
    }


    // =================================================
    // 5. SQL INJECTION
    // =================================================

    lines.forEach(
        (lineText, index) => {

            if (
                isCommentLine(lineText)
            ) {
                return;
            }


            const hasSQL =
                /\b(SELECT|INSERT|UPDATE|DELETE)\b/i
                    .test(lineText);


            if (!hasSQL) {
                return;
            }


            const dynamicSQL =
                /\+\s*[A-Za-z_$][\w$]*|\$\{[^}]+\}|`[^`]*\$\{[^}]+\}`/
                    .test(lineText);


            if (!dynamicSQL) {
                return;
            }


            const userInput =
                /\b(req\.|request\.|params|query|body|input|user|id|username|email)\b/i
                    .test(lineText);


            if (!userInput) {
                return;
            }


            issues.push(
                createSecurityIssue({

                    type:
                        "Possible SQL Injection",

                    severity:
                        "HIGH",

                    confidence:
                        testFile ? 84 : 94,

                    owasp:
                        "A03 - Injection",

                    file:
                        relativeFile,

                    line:
                        index + 1,

                    message:
                        "SQL is constructed using dynamic or potentially user-controlled input.",

                    recommendation:
                        "Use parameterized queries or prepared statements instead of string concatenation."
                })
            );
        }
    );


    // =================================================
    // 6. COMMAND INJECTION
    // =================================================

    lines.forEach(
        (lineText, index) => {

            if (
                isCommentLine(lineText)
            ) {
                return;
            }


            const command =
                /\b(exec|execSync|spawn|spawnSync)\s*\(/i
                    .test(lineText);


            if (!command) {
                return;
            }


            const dynamicInput =
                /\b(req\.|request\.|params|query|body|input|user|command|cmd|args)\b/i
                    .test(lineText);


            if (!dynamicInput) {
                return;
            }


            issues.push(
                createSecurityIssue({

                    type:
                        "Possible Command Injection",

                    severity:
                        "HIGH",

                    confidence:
                        testFile ? 82 : 92,

                    owasp:
                        "A03 - Injection",

                    file:
                        relativeFile,

                    line:
                        index + 1,

                    message:
                        "A system command appears to use dynamic or potentially user-controlled input.",

                    recommendation:
                        "Validate input strictly and avoid passing untrusted values to shell commands."
                })
            );
        }
    );


    // =================================================
    // 7. XSS - INNERHTML
    // =================================================

    lines.forEach(
        (lineText, index) => {

            if (
                isCommentLine(lineText)
            ) {
                return;
            }


            if (
                !/\.innerHTML\s*=/.test(
                    lineText
                )
            ) {
                return;
            }


            const dynamic =
                /\+|\$\{|req\.|request\.|user|input|param|query|body/i
                    .test(lineText);


            if (!dynamic) {
                return;
            }


            issues.push(
                createSecurityIssue({

                    type:
                        "Cross-Site Scripting (XSS)",

                    severity:
                        "MEDIUM",

                    confidence:
                        testFile ? 80 : 91,

                    owasp:
                        "A03 - Injection",

                    file:
                        relativeFile,

                    line:
                        index + 1,

                    message:
                        "Dynamic content is assigned directly to innerHTML and may allow script injection.",

                    recommendation:
                        "Use textContent or sanitize untrusted HTML before inserting it into the DOM."
                })
            );
        }
    );


    // =================================================
    // 8. DOCUMENT.WRITE
    // =================================================

    lines.forEach(
        (lineText, index) => {

            if (
                isCommentLine(lineText)
            ) {
                return;
            }


            if (
                !/document\.write\s*\(/.test(
                    lineText
                )
            ) {
                return;
            }


            issues.push(
                createSecurityIssue({

                    type:
                        "Unsafe DOM Manipulation",

                    severity:
                        "MEDIUM",

                    confidence:
                        testFile ? 75 : 84,

                    owasp:
                        "A03 - Injection",

                    file:
                        relativeFile,

                    line:
                        index + 1,

                    message:
                        "document.write() can introduce unsafe content into a web page.",

                    recommendation:
                        "Use safer DOM APIs such as textContent or controlled DOM manipulation."
                })
            );
        }
    );


    // =================================================
    // 9. TLS VERIFICATION DISABLED
    // =================================================

    lines.forEach(
        (lineText, index) => {

            if (
                isCommentLine(lineText)
            ) {
                return;
            }


            if (
                !/rejectUnauthorized\s*:\s*false/i.test(
                    lineText
                )
            ) {
                return;
            }
            // Ignore TLS configuration used only by test files.
// Ignore TLS configuration used only by test files.
if (!testFile) {

    issues.push(
        createSecurityIssue({

            type:
                "TLS Verification Disabled",

            severity:
                "HIGH",

            confidence:
                99,

            context:
                findingContext,

            owasp:
                "A02 - Cryptographic Failures",

            file:
                relativeFile,

            line:
                index + 1,

            message:
                "TLS certificate verification has been explicitly disabled.",

            recommendation:
                "Enable TLS certificate verification in production."
        })
    );

}
        }
    );  


    // =================================================
// COMMAND INJECTION
// =================================================

lines.forEach((lineText, index) => {

    if (isCommentLine(lineText)) {
        return;
    }

    const commandInjection =
        /\b(exec|execSync|spawn|spawnSync|execFile|execFileSync)\s*\([^)]*(\+|`|\$\{)/i
            .test(lineText);

    if (!commandInjection) {
        return;
    }

    issues.push(
        createSecurityIssue({

            type:
                "Possible Command Injection",

            severity:
                "HIGH",

            confidence:
                testFile ? 80 : 93,

            owasp:
                "A03 - Injection",

            file:
                relativeFile,

            line:
                index + 1,

            message:
                "User-controlled or dynamically constructed data may be passed to a command execution function.",

            recommendation:
                "Avoid constructing shell commands from untrusted input. Use safe argument-based APIs, strict allowlists, and avoid shell interpretation where possible."

        })
    );

});

// =================================================
// CROSS-SITE SCRIPTING (XSS)
// =================================================

lines.forEach((lineText, index) => {

    if (isCommentLine(lineText)) {
        return;
    }

    // Find variables receiving user-controlled input
    const inputMatch = lineText.match(
        /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:req\.(?:query|params|body)|request\.(?:query|params|body))\b/i
    );

    if (!inputMatch) {
        return;
    }

    const variableName = inputMatch[1];

    // Look at the following lines for HTML output
    const remainingLines = lines.slice(
        index + 1,
        Math.min(index + 6, lines.length)
    );

    const outputPattern = new RegExp(
        String.raw`\b(?:res\.(?:send|write)|document\.(?:write|writeln))\s*\([^)]*\b${variableName}\b`,
        "i"
    );

    const htmlAssignmentPattern = new RegExp(
        String.raw`\binnerHTML\s*=\s*[^;]*\b${variableName}\b`,
        "i"
    );

    const vulnerableOutput = remainingLines.some(
        (nextLine) =>
            outputPattern.test(nextLine) ||
            htmlAssignmentPattern.test(nextLine)
    );

    if (!vulnerableOutput) {
        return;
    }

    issues.push(
        createSecurityIssue({

            type:
                "Cross-Site Scripting (XSS)",

            severity:
                "MEDIUM",

            confidence:
                testFile ? 80 : 92,

            context:
                findingContext,

            owasp:
                "A03 - Injection",

            file:
                relativeFile,

            line:
                index + 1,

            message:
                "User-controlled input is assigned to a variable and later written directly into an HTML response.",

            recommendation:
                "Encode untrusted output before rendering it as HTML. Prefer framework-provided output escaping and avoid writing untrusted data directly into HTML."
        })
    );
});
    // =================================================
// 10. DANGEROUS DYNAMIC CODE EXECUTION
// =================================================

lines.forEach(
    (lineText, index) => {

        if (isCommentLine(lineText)) {
            return;
        }

        if (
            !/\beval\s*\(|\bnew\s+Function\s*\(/i.test(
                lineText
            )
        ) {
            return;
        }

        issues.push(
            createSecurityIssue({

                type:
                    "Dangerous Dynamic Code Execution",

                severity:
                    "HIGH",

                confidence:
                    testFile ? 78 : 94,

                context:
                    findingContext,

                owasp:
                    "A03 - Injection",

                file:
                    relativeFile,

                line:
                    index + 1,

                message:
                    "Dynamic code execution using eval() or Function() may execute untrusted input.",

                recommendation:
                    "Avoid eval() and dynamic Function(). Use explicit functions or safe parsers instead."
            })
        );
    }
);

// =================================================
// PATH TRAVERSAL
// =================================================

lines.forEach((lineText, index) => {

    if (isCommentLine(lineText)) {
        return;
    }

    const pathTraversal =
        /\b(?:readFile|readFileSync|writeFile|writeFileSync|unlink|unlinkSync|createReadStream)\s*\([^)]*(?:\+|`|\$\{)/i
            .test(lineText);

    if (!pathTraversal) {
        return;
    }

    // Only flag dynamically constructed filesystem paths.
    const hasPathInput =
        /(?:userPath|filePath|fileName|filename|req\.(?:query|params|body)|request\.(?:query|params|body))/i
            .test(lineText);

    if (!hasPathInput) {
        return;
    }

    issues.push(
        createSecurityIssue({

            type:
                "Path Traversal",

            severity:
                "HIGH",

            confidence:
                testFile ? 78 : 90,

            context:
                findingContext,

            owasp:
                "A01 - Broken Access Control",

            file:
                relativeFile,

            line:
                index + 1,

            message:
                "A dynamically constructed filesystem path may allow access to files outside the intended directory.",

            recommendation:
                "Validate and canonicalize user-controlled paths. Use an allowlist of permitted files or directories and prevent ../ traversal sequences."
        })
    );

});

// =================================================
// SERVER-SIDE REQUEST FORGERY (SSRF)
// =================================================

lines.forEach((lineText, index) => {

    if (isCommentLine(lineText)) {
        return;
    }

    const httpRequest =
        /\b(?:axios\.(?:get|post|put|delete|patch|request)|fetch|https?\.(?:get|request))\s*\(/i
            .test(lineText);

    if (!httpRequest) {
        return;
    }

    const userControlledUrl =
        /\b(?:req|request)\.(?:query|params|body)\b/i
            .test(lineText);

    if (!userControlledUrl) {
        return;
    }

    issues.push(
        createSecurityIssue({

            type:
                "Server-Side Request Forgery (SSRF)",

            severity:
                "HIGH",

            confidence:
                testFile ? 78 : 91,

            context:
                findingContext,

            owasp:
                "A10 - Server-Side Request Forgery",

            file:
                relativeFile,

            line:
                index + 1,

            message:
                "A server-side HTTP request uses a URL that may be controlled by user input.",

            recommendation:
                "Do not allow arbitrary user-controlled URLs. Use an allowlist of permitted destinations and validate the protocol, host, and resolved IP address before making server-side requests."
        })
    );

});
// =================================================
// 11. INSECURE RANDOMNESS
// =================================================

lines.forEach(
    (lineText, index) => {

        if (isCommentLine(lineText)) {
            return;
        }

        const insecureRandom =
            /\b(token|secret|password|passwd|pwd|api[_-]?key|auth|session|otp|code|nonce|key)\b\s*[:=]\s*.*\bMath\.random\s*\(/i
                .test(lineText);

        if (!insecureRandom) {
            return;
        }

        issues.push(
            createSecurityIssue({

                type:
                    "Insecure Randomness",

                severity:
                    "MEDIUM",

                confidence:
                    testFile ? 75 : 90,

                context:
                    findingContext,

                owasp:
                    "A02 - Cryptographic Failures",

                file:
                    relativeFile,

                line:
                    index + 1,

                message:
                    "Math.random() appears to be used to generate a security-sensitive value.",

                recommendation:
                    "Use a cryptographically secure random generator such as crypto.randomBytes() or crypto.randomInt()."
            })
        );
    }
);

// =================================================
// 12. UNSAFE HTML INJECTION
// =================================================

lines.forEach(
    (lineText, index) => {

        if (isCommentLine(lineText)) {
            return;
        }

        if (!/dangerouslySetInnerHTML\s*[:=]/i.test(lineText)) {
            return;
        }

        issues.push(
            createSecurityIssue({

                type:
                    "Unsafe HTML Injection",

                severity:
                    "MEDIUM",

                confidence:
                    testFile ? 70 : 88,

                context:
                    findingContext,

                owasp:
                    "A03 - Injection",

                file:
                    relativeFile,

                line:
                    index + 1,

                message:
                    "Raw HTML is being injected into a React component and may create an XSS risk when content is not properly sanitized.",

                recommendation:
                    "Avoid dangerouslySetInnerHTML where possible. If required, sanitize the HTML with a trusted sanitizer before rendering."
            })
        );
    }
);




    // =================================================
    // 10. WEAK CRYPTOGRAPHY
    // =================================================

    lines.forEach(
        (lineText, index) => {

            if (
                isCommentLine(lineText)
            ) {
                return;
            }


            const weakHash =
                /\b(createHash|createHmac)\s*\(\s*["'`](md5|sha1)["'`]/i
                    .test(lineText);


            if (!weakHash) {
                return;
            }


            issues.push(
                createSecurityIssue({

                    type:
                        "Weak Cryptographic Algorithm",

                    severity:
                        "MEDIUM",

                    confidence:
                        testFile ? 78 : 91,

                    owasp:
                        "A02 - Cryptographic Failures",

                    file:
                        relativeFile,

                    line:
                        index + 1,

                    message:
                        "A weak cryptographic hashing algorithm is being used.",

                    recommendation:
                        "Use a stronger modern algorithm such as SHA-256 or an appropriate password-hashing algorithm."
                })
            );
        }
    );

        // =================================================
    // 11. DANGEROUS DYNAMIC CODE EXECUTION
    // =================================================

    lines.forEach(
        (lineText, index) => {

            if (
                isCommentLine(lineText)
            ) {
                return;
            }

            const dynamicCode =
                /\b(eval\s*\(|new\s+Function\s*\()/i
                    .test(lineText);

            if (!dynamicCode) {
                return;
            }

            // Test files often contain intentional examples.
            if (testFile) {
                return;
            }

            issues.push(
                createSecurityIssue({

                    type:
                        "Dangerous Dynamic Code Execution",

                    severity:
                        "HIGH",

                    confidence:
                        92,

                    context:
                        findingContext,

                    owasp:
                        "A03 - Injection",

                    file:
                        relativeFile,

                    line:
                        index + 1,

                    message:
                        "Dynamic code execution using eval() or Function() may allow untrusted input to execute as code.",

                    recommendation:
                        "Avoid eval() and dynamic Function(). Use safe parsing and explicit functions instead."
                })
            );
        }
    );
    


    // =================================================
    // 11. WEAK PASSWORD HASHING
    // =================================================

    lines.forEach(
        (lineText, index) => {

            if (
                isCommentLine(lineText)
            ) {
                return;
            }


            const weakPasswordHash =
                /\b(md5|sha1)\s*\([^)]*\b(password|passwd|pwd|userPassword)\b/i
                    .test(lineText);


            if (!weakPasswordHash) {
                return;
            }


            issues.push(
                createSecurityIssue({

                    type:
                        "Weak Password Hashing",

                    severity:
                        "HIGH",

                    confidence:
                        95,

                    owasp:
                        "A02 - Cryptographic Failures",

                    file:
                        relativeFile,

                    line:
                        index + 1,

                    message:
                        "A password appears to be processed using a weak hashing algorithm.",

                    recommendation:
                        "Use Argon2, bcrypt, or scrypt for password hashing."
                })
            );
        }
    );


    // =================================================
    // 12. PYTHON PICKLE
    // =================================================

    lines.forEach(
        (lineText, index) => {

            if (
                isCommentLine(lineText)
            ) {
                return;
            }


            if (
                /\bpickle\.loads\s*\(/.test(
                    lineText
                )
            ) {

                issues.push(
                    createSecurityIssue({

                        type:
                            "Unsafe Deserialization",

                        severity:
                            "HIGH",

                        confidence:
                            91,

                        owasp:
                            "A08 - Software and Data Integrity Failures",

                        file:
                            relativeFile,

                        line:
                            index + 1,

                        message:
                            "pickle.loads() can execute malicious payloads when processing untrusted data.",

                        recommendation:
                            "Avoid deserializing untrusted pickle data. Use a safer serialization format such as JSON where appropriate."
                    })
                );
            }
        }
    );


    // =================================================
    // 13. PYTHON YAML
    // =================================================

    lines.forEach(
        (lineText, index) => {

            if (
                isCommentLine(lineText)
            ) {
                return;
            }


            if (
                /\byaml\.load\s*\(/.test(
                    lineText
                ) &&
                !/SafeLoader/i.test(
                    lineText
                )
            ) {

                issues.push(
                    createSecurityIssue({

                        type:
                            "Unsafe YAML Loading",

                        severity:
                            "HIGH",

                        confidence:
                            90,

                        owasp:
                            "A08 - Software and Data Integrity Failures",

                        file:
                            relativeFile,

                        line:
                            index + 1,

                        message:
                            "yaml.load() may deserialize unsafe YAML content.",

                        recommendation:
                            "Use yaml.safe_load() or SafeLoader when processing untrusted YAML."
                    })
                );
            }
        }
    );


    return issues;
}


// =====================================================
// QUALITY ANALYSIS
// =====================================================

function analyzeQuality(
    content,
    relativeFile
) {

    const issues = [];

    const lines =
        content.split("\n");


    // =================================================
    // TODO
    // =================================================

    lines.forEach(
        (line, index) => {

            if (
                /\bTODO\b/i.test(
                    line
                )
            ) {

                issues.push(
                    createQualityIssue({

                        type:
                            "TODO Comment",

                        severity:
                            "LOW",

                        file:
                            relativeFile,

                        line:
                            index + 1,

                        message:
                            "This file contains a TODO item.",

                        recommendation:
                            "Review and resolve pending TODO items."
                    })
                );
            }
        }
    );


    // =================================================
    // CONSOLE STATEMENTS
    // =================================================

    lines.forEach(
        (line, index) => {

            if (
                /\bconsole\.(log|debug|info)\s*\(/.test(
                    line
                )
            ) {

                issues.push(
                    createQualityIssue({

                        type:
                            "Console Statement",

                        severity:
                            "LOW",

                        file:
                            relativeFile,

                        line:
                            index + 1,

                        message:
                            "A console statement is present in the source code.",

                        recommendation:
                            "Use a proper logging framework or remove unnecessary console statements."
                    })
                );
            }
        }
    );


    // =================================================
    // LONG LINES
    // =================================================

    lines.forEach(
        (line, index) => {

            if (
                line.length > 150
            ) {

                issues.push(
                    createQualityIssue({

                        type:
                            "Long Line",

                        severity:
                            "LOW",

                        file:
                            relativeFile,

                        line:
                            index + 1,

                        message:
                            "This line is unusually long and may reduce readability.",

                        recommendation:
                            "Break the line into smaller logical sections."
                    })
                );
            }
        }
    );


    // =================================================
    // EMPTY CATCH
    // =================================================

    const emptyCatchRegex =
        /catch\s*\([^)]*\)\s*\{\s*\}/g;

    let match;


    while (
        (match =
            emptyCatchRegex.exec(
                content
            )) !== null
    ) {

        issues.push(
            createQualityIssue({

                type:
                    "Empty Catch Block",

                severity:
                    "MEDIUM",

                file:
                    relativeFile,

                line:
                    getLineNumber(
                        content,
                        match.index
                    ),

                message:
                    "An exception is caught without being handled or logged.",

                recommendation:
                    "Handle the exception appropriately or log useful debugging information."
            })
        );
    }


    // =================================================
    // JAVASCRIPT VAR
    // =================================================

    const extension =
        path
            .extname(
                relativeFile
            )
            .toLowerCase();


    if (
        [
            ".js",
            ".jsx",
            ".ts",
            ".tsx"
        ].includes(
            extension
        )
    ) {

        lines.forEach(
            (line, index) => {

                if (
                    /^\s*var\s+/.test(
                        line
                    )
                ) {

                    issues.push(
                        createQualityIssue({

                            type:
                                "Use of var",

                            severity:
                                "LOW",

                            file:
                                relativeFile,

                            line:
                                index + 1,

                            message:
                                "The legacy var declaration is being used.",

                            recommendation:
                                "Prefer const or let for modern JavaScript."
                        })
                    );
                }
            }
        );
    }


    return issues;
}


// =====================================================
// REMOVE DUPLICATES
// =====================================================

function removeDuplicateIssues(
    issues
) {

    const seen =
        new Set();


    return issues.filter(
        issue => {

            const key =
                [
                    issue.type,
                    issue.file,
                    issue.line
                ].join("|");


            if (
                seen.has(key)
            ) {
                return false;
            }


            seen.add(key);

            return true;
        }
    );
}


// =====================================================
// FUNCTION COUNT
// =====================================================

function countFunctions(
    content,
    extension
) {

    let count = 0;


    if (
        [
            ".js",
            ".jsx",
            ".ts",
            ".tsx"
        ].includes(
            extension
        )
    ) {

        const patterns = [

            /\bfunction\s+[A-Za-z_$][\w$]*\s*\(/g,

            /\b[A-Za-z_$][\w$]*\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g,

            /\b[A-Za-z_$][\w$]*\s*=\s*(?:async\s*)?[A-Za-z_$][\w$]*\s*=>/g,

            /\b(?:async\s+)?[A-Za-z_$][\w$]*\s*\([^)]*\)\s*\{/g
        ];


        for (
            const pattern of patterns
        ) {

            const matches =
                content.match(
                    pattern
                );


            if (matches) {
                count +=
                    matches.length;
            }
        }

    } else if (
        extension === ".py"
    ) {

        const matches =
            content.match(
                /^\s*(?:async\s+)?def\s+\w+\s*\(/gm
            );


        count =
            matches
                ? matches.length
                : 0;

    } else {

        const matches =
            content.match(
                /^\s*(?:public|private|protected|static|final|async|virtual|override|\s)*[\w<>\[\], ?]+\s+\w+\s*\([^;{}]*\)\s*\{/gm
            );


        count =
            matches
                ? matches.length
                : 0;
    }


    return count;
}


// =====================================================
// CLASS COUNT
// =====================================================

function countClasses(
    content
) {

    const matches =
        content.match(
            /\bclass\s+[A-Za-z_$][\w$]*/g
        );


    return matches
        ? matches.length
        : 0;
}


// =====================================================
// COMPLEXITY
// =====================================================

function calculateComplexity(
    content
) {

    let complexity = 1;


    const patterns = [

        /\bif\s*\(/g,

        /\belse\s+if\s*\(/g,

        /\bfor\s*\(/g,

        /\bwhile\s*\(/g,

        /\bswitch\s*\(/g,

        /\bcase\s+/g,

        /\bcatch\s*\(/g,

        /&&/g,

        /\|\|/g,

        /\?\?/g
    ];


    for (
        const pattern of patterns
    ) {

        const matches =
            content.match(
                pattern
            );


        if (matches) {

            complexity +=
                matches.length;
        }
    }


    return complexity;
}


// =====================================================
// RISK SCORE
// =====================================================

function calculateRiskScore(
    securityIssues
) {

    const high =
        securityIssues.filter(
            issue =>
                issue.severity ===
                "HIGH"
        ).length;


    const medium =
        securityIssues.filter(
            issue =>
                issue.severity ===
                "MEDIUM"
        ).length;


    const low =
        securityIssues.filter(
            issue =>
                issue.severity ===
                "LOW"
        ).length;


    const highScore =
        Math.min(
            high,
            3
        ) * 20;


    const mediumScore =
        Math.min(
            medium,
            5
        ) * 7;


    const lowScore =
        Math.min(
            low,
            10
        ) * 2;


    return Math.min(
        highScore +
        mediumScore +
        lowScore,
        100
    );
}


// =====================================================
// RISK LEVEL
// =====================================================

function getRiskLevel(
    score
) {

    if (
        score >= 70
    ) {
        return "HIGH";
    }


    if (
        score >= 35
    ) {
        return "MEDIUM";
    }


    return "LOW";
}


// =====================================================
// SORT SECURITY FINDINGS
// =====================================================

function sortSecurityIssues(
    issues
) {

    const weight = {

        HIGH: 3,

        MEDIUM: 2,

        LOW: 1
    };


    return issues.sort(
        (a, b) => {

            const severityDifference =
                weight[b.severity] -
                weight[a.severity];


            if (
                severityDifference !== 0
            ) {
                return severityDifference;
            }


            return (
                (b.confidence || 0) -
                (a.confidence || 0)
            );
        }
    );
}


// =====================================================
// FINDING TYPE SUMMARY
// =====================================================

function createFindingTypeSummary(
    securityIssues
) {

    const summary = {};


    for (
        const issue of securityIssues
    ) {

        if (
            !summary[issue.type]
        ) {

            summary[issue.type] = {

                count: 0,

                high: 0,

                medium: 0,

                low: 0,

                averageConfidence: 0,

                totalConfidence: 0
            };
        }


        summary[
            issue.type
        ].count++;


        if (
            issue.severity ===
            "HIGH"
        ) {

            summary[
                issue.type
            ].high++;
        }


        if (
            issue.severity ===
            "MEDIUM"
        ) {

            summary[
                issue.type
            ].medium++;
        }


        if (
            issue.severity ===
            "LOW"
        ) {

            summary[
                issue.type
            ].low++;
        }


        summary[
            issue.type
        ].totalConfidence +=
            issue.confidence || 0;
    }


    // Calculate average confidence.
    for (
        const type of Object.keys(summary)
    ) {

        const item =
            summary[type];


        item.averageConfidence =
            Math.round(
                item.totalConfidence /
                item.count
            );


        delete item.totalConfidence;
    }


    return summary;
}


// =====================================================
// TOP FINDINGS
// =====================================================

function createTopFindings(
    securityIssues
) {

    return securityIssues
        .slice(0, 10)
        .map(
            issue => ({

                type:
                    issue.type,

                severity:
                    issue.severity,

                confidence:
                    issue.confidence,

                owasp:
                    issue.owasp,

                file:
                    issue.file,

                line:
                    issue.line,

                message:
                    issue.message,

                recommendation:
                    issue.recommendation
            })
        );
}


// =====================================================
// OWASP SUMMARY
// =====================================================

function createOwaspSummary(
    securityIssues
) {

    const summary = {};


    for (
        const issue of securityIssues
    ) {

        if (
            !issue.owasp
        ) {
            continue;
        }


        if (
            !summary[issue.owasp]
        ) {

            summary[
                issue.owasp
            ] = 0;
        }


        summary[
            issue.owasp
        ]++;
    }


    return summary;
}


// =====================================================
// MAIN ANALYZER
// =====================================================

function analyzeProject(
    projectPath
) {

    console.log(
        "Starting CodeSentinel analysis..."
    );


    const startTime =
        Date.now();


    // -------------------------------------------------
    // VALIDATE PROJECT
    // -------------------------------------------------

    if (
        !fs.existsSync(
            projectPath
        )
    ) {

        throw new Error(
            `Project path does not exist: ${projectPath}`
        );
    }


    // -------------------------------------------------
    // FIND SOURCE FILES
    // -------------------------------------------------

    const sourceFiles =
        getSourceFiles(
            projectPath
        );


    console.log(
        `Found ${sourceFiles.length} source files`
    );


    const files = [];


    let totalLines = 0;

    let totalFunctions = 0;

    let totalClasses = 0;

    let totalComplexity = 0;


    let allSecurityIssues = [];

    let allQualityIssues = [];


    // -------------------------------------------------
    // ANALYZE EVERY FILE
    // -------------------------------------------------

    for (
        const filePath of sourceFiles
    ) {

        const content =
            readSourceFile(
                filePath
            );


        if (
            content === null
        ) {
            continue;
        }


        const relativeFile =
            path
                .relative(
                    projectPath,
                    filePath
                )
                .replace(
                    /\\/g,
                    "/"
                );


        const extension =
            path
                .extname(
                    filePath
                )
                .toLowerCase();


        const lines =
            content
                .split("\n")
                .length;


        const functions =
            countFunctions(
                content,
                extension
            );


        const classes =
            countClasses(
                content
            );


        const complexity =
            calculateComplexity(
                content
            );


        let securityIssues =
            analyzeSecurity(
                content,
                relativeFile
            );


        let qualityIssues =
            analyzeQuality(
                content,
                relativeFile
            );


        securityIssues =
            removeDuplicateIssues(
                securityIssues
            );


        qualityIssues =
            removeDuplicateIssues(
                qualityIssues
            );
           

// =================================================
// ATTACH SOURCE CODE TO FINDINGS
// =================================================

[...securityIssues, ...qualityIssues].forEach(
    issue => {

        const context =
            issue.category === "SECRET"
                ? 1
                : 4;

        let sourceCode =
            getSourceSnippet(
                content,
                issue.line,
                context
            );

        // -----------------------------------------
        // MASK SECRETS
        // -----------------------------------------

        if (
            issue.category === "SECRET"
        ) {

            sourceCode =
                sourceCode.replace(
                    /(\b(?:api[_-]?key|secret[_-]?key|access[_-]?token|auth[_-]?token|password|passwd|pwd)\s*[:=]\s*["'`])([^"'`\n]+)(["'`])/gi,
                    "$1••••••••••••$3"
                );
        }

        issue.sourceCode =
            sourceCode;
    }
);


        files.push({

            file:
                relativeFile,

            lines,

            functions,

            classes,

            complexity,

            securityIssues,

            qualityIssues
        });


        totalLines +=
            lines;


        totalFunctions +=
            functions;


        totalClasses +=
            classes;


        totalComplexity +=
            complexity;


        allSecurityIssues =
            allSecurityIssues.concat(
                securityIssues
            );


        allQualityIssues =
            allQualityIssues.concat(
                qualityIssues
            );
    }


    // -------------------------------------------------
    // GLOBAL DEDUPLICATION
    // -------------------------------------------------

    allSecurityIssues =
        removeDuplicateIssues(
            allSecurityIssues
        );


    allQualityIssues =
        removeDuplicateIssues(
            allQualityIssues
        );


    // -------------------------------------------------
    // SORT SECURITY ISSUES
    // -------------------------------------------------

    allSecurityIssues =
        sortSecurityIssues(
            allSecurityIssues
        );


    // -------------------------------------------------
    // SECURITY SUMMARY
    // -------------------------------------------------

    const securitySummary = {

        high:
            allSecurityIssues.filter(
                issue =>
                    issue.severity ===
                    "HIGH"
            ).length,

        medium:
            allSecurityIssues.filter(
                issue =>
                    issue.severity ===
                    "MEDIUM"
            ).length,

        low:
            allSecurityIssues.filter(
                issue =>
                    issue.severity ===
                    "LOW"
            ).length
    };

    // -------------------------------------------------
// SECRET SUMMARY
// -------------------------------------------------

const secretIssues =
    allSecurityIssues.filter(
        issue =>
            issue.category ===
            "SECRET"
    );

const secretsSummary = {
    total:
        secretIssues.length,

    high:
        secretIssues.filter(
            issue =>
                issue.severity ===
                "HIGH"
        ).length,

    medium:
        secretIssues.filter(
            issue =>
                issue.severity ===
                "MEDIUM"
        ).length,

    low:
        secretIssues.filter(
            issue =>
                issue.severity ===
                "LOW"
        ).length
};


    // -------------------------------------------------
    // OWASP SUMMARY
    // -------------------------------------------------

    const owaspSummary =
        createOwaspSummary(
            allSecurityIssues
        );


    // -------------------------------------------------
    // FINDING TYPE SUMMARY
    // -------------------------------------------------

    const findingTypeSummary =
        createFindingTypeSummary(
            allSecurityIssues
        );


    // -------------------------------------------------
    // TOP 10 FINDINGS
    // -------------------------------------------------

    const topFindings =
        createTopFindings(
            allSecurityIssues
        );


    // -------------------------------------------------
    // RISK SCORE
    // -------------------------------------------------

    const riskScore =
        calculateRiskScore(
            allSecurityIssues
        );


    const riskLevel =
        getRiskLevel(
            riskScore
        );


    // -------------------------------------------------
    // ANALYSIS TIME
    // -------------------------------------------------

    const analysisTime =
        Date.now() -
        startTime;


    // -------------------------------------------------
    // FINAL RESULT
    // -------------------------------------------------

    const analysis = {

        // Basic metrics
        filesAnalyzed:
            files.length,

        totalLines,

        totalFunctions,

        totalClasses,

        totalComplexity,

        // Risk
        riskScore,

        riskLevel,

        // Security
        // Security

securitySummary,

securityIssues:
    allSecurityIssues,

// Secrets

secretsSummary,

        // Quality
        qualityIssues:
            allQualityIssues,

        // OWASP
        owaspSummary,

        // New competition-ready data
        findingTypeSummary,

        topFindings,

        // File-level analysis
        files,

        // Performance
        analysisTime
    };


    // =================================================
    // TERMINAL OUTPUT
    // =================================================

    console.log(
        "======================================"
    );

    console.log(
        "CodeSentinel Analysis Complete"
    );

    console.log(
        `Files: ${files.length}`
    );

    console.log(
        `Lines: ${totalLines}`
    );

    console.log(
        `Functions: ${totalFunctions}`
    );

    console.log(
        `Classes: ${totalClasses}`
    );

    console.log(
        `Complexity: ${totalComplexity}`
    );

    console.log(
        `Security Issues: ${allSecurityIssues.length}`
    );

    console.log(
        `  HIGH: ${securitySummary.high}`
    );

    console.log(
        `  MEDIUM: ${securitySummary.medium}`
    );

    console.log(
        `  LOW: ${securitySummary.low}`
    );

    console.log(
        `Quality Issues: ${allQualityIssues.length}`
    );

    console.log(
        `Risk Score: ${riskScore}/100`
    );

    console.log(
        `Risk Level: ${riskLevel}`
    );

    console.log(
        `Analysis Time: ${analysisTime} ms`
    );


    // -------------------------------------------------
    // FINDING BREAKDOWN
    // -------------------------------------------------

    console.log(
        "--------------------------------------"
    );

    console.log(
        "SECURITY FINDING BREAKDOWN"
    );

    for (
        const [
            type,
            data
        ] of Object.entries(
            findingTypeSummary
        )
    ) {

        console.log(
            `${type}: ${data.count} | ` +
            `HIGH: ${data.high} | ` +
            `MEDIUM: ${data.medium} | ` +
            `LOW: ${data.low} | ` +
            `Confidence: ${data.averageConfidence}%`
        );
    }


    // -------------------------------------------------
    // OWASP BREAKDOWN
    // -------------------------------------------------

    console.log(
        "--------------------------------------"
    );

    console.log(
        "OWASP BREAKDOWN"
    );


    for (
        const [
            category,
            count
        ] of Object.entries(
            owaspSummary
        )
    ) {

        console.log(
            `${category}: ${count}`
        );
    }


    // -------------------------------------------------
    // TOP 10
    // -------------------------------------------------

    console.log(
        "--------------------------------------"
    );

    console.log(
        "TOP SECURITY FINDINGS"
    );


    topFindings.forEach(
        (issue, index) => {

            console.log(
                `${index + 1}. ` +
                `${issue.type} | ` +
                `${issue.severity} | ` +
                `${issue.confidence}% | ` +
                `${issue.file}:${issue.line}`
            );
        }
    );


    console.log(
        "======================================"
    );


    return analysis;
}


// =====================================================
// EXPORT
// =====================================================

module.exports = {
    analyzeProject
};