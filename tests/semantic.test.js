import assert from "assert";
import semanticEngine from "../backend/engines/semanticEngine.js";


async function runTests() {

  console.log("\nRunning VibeGuard Semantic Engine Tests...\n");


  // ----------------------------------------
  // TEST 1: SQL Injection
  // ----------------------------------------

  const sqlInjectionCode = `
import sqlite3

def get_user(user_id):
    query = "SELECT * FROM users WHERE id = " + user_id
    connection = sqlite3.connect("users.db")
    return connection.execute(query).fetchall()
`;


  const sqlResult = await semanticEngine(
    sqlInjectionCode,
    "sql_injection.py"
  );


  const sqlFinding = sqlResult.findings.find(
    finding => finding.rule.id === "CWE-89"
  );


  assert.ok(
    sqlFinding,
    "SQL injection should produce a CWE-89 finding."
  );


  console.log("✅ Test 1 passed: SQL Injection");


  // ----------------------------------------
  // TEST 2: Command Injection
  // ----------------------------------------

  const commandInjectionCode = `
import os

def ping(host):
    os.system("ping " + host)
`;


  const commandResult = await semanticEngine(
    commandInjectionCode,
    "command_injection.py"
  );


  const commandFinding = commandResult.findings.find(
    finding => finding.rule.id === "CWE-78"
  );


  assert.ok(
    commandFinding,
    "Command injection should produce a CWE-78 finding."
  );


  console.log("✅ Test 2 passed: Command Injection");


  // ----------------------------------------
  // TEST 3: Safe Code
  // ----------------------------------------

  const safeCode = `
def add_numbers(a, b):
    return a + b

result = add_numbers(5, 10)
print(result)
`;


  const safeResult = await semanticEngine(
    safeCode,
    "safe.py"
  );


  assert.strictEqual(
    safeResult.findings.length,
    0,
    "Safe code should not produce semantic findings."
  );


  console.log("✅ Test 3 passed: Safe Code");


  // ----------------------------------------
  // TEST 4: Finding Contract
  // ----------------------------------------

  if (sqlFinding) {

    assert.strictEqual(
      sqlFinding.type,
      "semantic"
    );

    assert.strictEqual(
      sqlFinding.source,
      "semantic-engine"
    );

    assert.strictEqual(
      sqlFinding.rule.authority,
      "CWE"
    );

    assert.ok(
      sqlFinding.confidence >= 0 &&
      sqlFinding.confidence <= 1
    );

    assert.strictEqual(
      sqlFinding.understanding_required,
      true
    );

  }


  console.log(
    "✅ Test 4 passed: Finding Contract"
  );


  console.log(
    "\n🎉 All semantic engine tests passed!\n"
  );
}


runTests().catch(error => {

  console.error(
    "\n❌ Semantic engine tests failed:\n",
    error
  );

  process.exit(1);
});