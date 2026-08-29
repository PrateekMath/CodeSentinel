// =====================================================
// CodeSentinel AI Service
// =====================================================

// -----------------------------------------------------
// AI EXPLANATION SERVICE
// -----------------------------------------------------

function generateExplanation(issue) {

    const explanations = {

        "eval": {
            title: "Dangerous eval() Usage",

            explanation:
                "eval() executes a string as JavaScript code. If the input can be controlled by a user, an attacker may execute arbitrary code.",

            impact:
                "This can lead to code execution, data theft, or compromise of the application.",

            fix:
                "Avoid eval(). Use safer functions or explicit parsing instead.",

            codeExample:
                "Before: eval(userInput);\n\nAfter: Use a safe parser or explicit function instead of user input."
        },

        "sql-injection": {
            title: "SQL Injection",

            explanation:
                "User-controlled data appears to be combined directly with an SQL query.",

            impact:
                "An attacker may manipulate the SQL query and access, modify, or delete database information.",

            fix:
                "Use parameterized queries or prepared statements.",

            codeExample:
                "Before: const query = \"SELECT * FROM users WHERE id=\" + userId;\n\nAfter: Use a parameterized query."
        },

        "hardcoded-secret": {
            title: "Hardcoded Secret",

            explanation:
                "A password, API key, token, or other sensitive credential appears directly in the source code.",

            impact:
                "Anyone with access to the source code may obtain the credential and potentially access protected services.",

            fix:
                "Move secrets to environment variables or a secure secrets manager."
        },

        "long-function": {
            title: "Long Function",

            explanation:
                "This function contains a large amount of code and may be doing too many things.",

            impact:
                "Large functions are harder to understand, test, debug, and maintain.",

            fix:
                "Break the function into smaller functions with clear responsibilities."
        },

        "technical-debt": {
            title: "Technical Debt",

            explanation:
                "A TODO or FIXME comment indicates unfinished work or a known issue.",

            impact:
                "Unresolved technical debt can increase maintenance cost and lead to forgotten bugs.",

            fix:
                "Review and resolve the TODO/FIXME item or create a tracked issue."
        },

        "deep-nesting": {
            title: "Deep Code Nesting",

            explanation:
                "The code contains several levels of nested control structures.",

            impact:
                "Deep nesting makes program flow difficult to understand and increases maintenance complexity.",

            fix:
                "Simplify the control flow and extract nested logic into separate functions."
        },

        "duplicate-code": {
            title: "Duplicate Code",

            explanation:
                "The same or very similar code appears multiple times.",

            impact:
                "Changes may need to be made in several places, increasing the chance of inconsistent behavior.",

            fix:
                "Extract repeated logic into a reusable function."
        }

    };

    return explanations[issue.type] || {

        title: issue.type,

        explanation:
            issue.message,

        impact:
            "This issue may affect code security or maintainability.",

        fix:
            issue.recommendation

    };
}


// =====================================================
// AI FIX GENERATOR
// =====================================================

function generateAIFix(issue, sourceCode) {

    if (!issue) {
        throw new Error(
            "Security finding is required."
        );
    }

    if (!sourceCode) {
        throw new Error(
            "Source code is required."
        );
    }

    const issueType =
        String(
            issue.type || ""
        ).toLowerCase();


    // -------------------------------------------------
    // TLS VERIFICATION
    // -------------------------------------------------

    if (
        issueType.includes(
            "tls verification"
        )
    ) {

        const fixedCode =
            sourceCode.replace(
                /rejectUnauthorized\s*:\s*false/gi,
                "rejectUnauthorized: true"
            );

        return {

            fixedCode,

            explanation:
                "TLS certificate verification was disabled. The fix enables certificate verification so the client does not accept untrusted TLS certificates.",

            changes: [
                "Changed rejectUnauthorized from false to true.",
                "TLS certificate validation is now enabled."
            ]

        };
    }


    // -------------------------------------------------
    // HARD CODED PASSWORD
    // -------------------------------------------------

    if (
        issueType.includes(
            "hardcoded password"
        )
    ) {

        return {

            fixedCode:
                `// Store the password in an environment variable
const password = process.env.PASSWORD;

${sourceCode}`,

            explanation:
                "The password should not be stored directly in source code. Move it to an environment variable or secure secrets manager.",

            changes: [
                "Moved the password to an environment variable.",
                "Use process.env.PASSWORD for the credential."
            ]

        };
    }


    // -------------------------------------------------
    // EXPOSED SECRET
    // -------------------------------------------------

    if (
        issueType.includes(
            "exposed secret"
        )
    ) {

        return {

            fixedCode:
                `// Store the secret in an environment variable
const secret = process.env.SECRET_KEY;

${sourceCode}`,

            explanation:
                "Sensitive credentials should not be committed to source code. Store them in environment variables or a secrets manager.",

            changes: [
                "Moved the secret to an environment variable.",
                "Use process.env.SECRET_KEY."
            ]

        };
    }


    // -------------------------------------------------
    // EVAL
    // -------------------------------------------------

    if (
        issueType.includes(
            "eval"
        )
    ) {

        const fixedCode =
            sourceCode.replace(
                /eval\s*\(/gi,
                "/* Replace eval() with safe parsing */ safeParse("
            );

        return {

            fixedCode,

            explanation:
                "eval() can execute dynamically generated JavaScript and may allow arbitrary code execution. Replace it with explicit parsing or a safe function.",

            changes: [
                "Removed direct use of eval().",
                "Use a safe parser appropriate for the expected input."
            ]

        };
    }


    // -------------------------------------------------
    // XSS
    // -------------------------------------------------

    if (
        issueType.includes(
            "cross-site scripting"
        ) ||
        issueType.includes(
            "xss"
        )
    ) {

        const fixedCode =
            sourceCode.replace(
                /\.innerHTML\s*=/gi,
                ".textContent ="
            );

        return {

            fixedCode,

            explanation:
                "Directly assigning untrusted data to innerHTML can allow script injection. textContent treats the value as text instead of HTML.",

            changes: [
                "Replaced innerHTML assignment with textContent.",
                "Untrusted HTML is no longer interpreted as executable markup."
            ]

        };
    }


    // -------------------------------------------------
    // COMMAND INJECTION
    // -------------------------------------------------

    if (
        issueType.includes(
            "command injection"
        )
    ) {

        return {

            fixedCode:
                `// Validate command arguments before execution.
// Prefer execFile/spawn with an argument array instead of shell interpolation.

${sourceCode}`,

            explanation:
                "User-controlled values should not be directly interpolated into shell commands. Validate input and use APIs that pass arguments separately.",

            changes: [
                "Avoid shell command interpolation.",
                "Validate all user-controlled command arguments.",
                "Prefer execFile or spawn with an argument array."
            ]

        };
    }


    // -------------------------------------------------
    // SQL INJECTION
    // -------------------------------------------------

    if (
        issueType.includes(
            "sql injection"
        )
    ) {

        return {

            fixedCode:
                `// Use a parameterized query instead of string concatenation.

${sourceCode}`,

            explanation:
                "SQL queries should use parameterized values so user input cannot modify the SQL statement itself.",

            changes: [
                "Avoid SQL string concatenation.",
                "Use prepared statements or parameterized queries."
            ]

        };
    }


    // -------------------------------------------------
    // WEAK CRYPTOGRAPHY
    // -------------------------------------------------

    if (
        issueType.includes(
            "weak cryptographic"
        )
    ) {

        const fixedCode =
            sourceCode
                .replace(
                    /["']md5["']/gi,
                    '"sha256"'
                )
                .replace(
                    /["']sha1["']/gi,
                    '"sha256"'
                );

        return {

            fixedCode,

            explanation:
                "MD5 and SHA-1 are considered weak for modern security-sensitive applications. A stronger algorithm such as SHA-256 should be used where appropriate.",

            changes: [
                "Replaced weak hashing algorithm references with SHA-256.",
                "Review the cryptographic use case before deploying the change."
            ]

        };
    }


    // -------------------------------------------------
    // FALLBACK
    // -------------------------------------------------

    return {

        fixedCode:
            sourceCode,

        explanation:
            "An automatic code transformation was not generated for this finding. Review the recommended remediation and apply the appropriate secure coding pattern.",

        changes: [
            "No automatic source transformation was applied.",
            "Manual security review is recommended."
        ]

    };
}


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    generateExplanation,

    generateAIFix

};