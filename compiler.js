const fs = require("fs");

const keywords = {
  ye: "VAR",
  bol: "PRINT",
  agar: "IF",
  yafir: "ELSE_IF",
  varna: "ELSE",
  jabtak: "WHILE",
  tabtak: "LOOP_START",
};

// Lexer: Converts source code into tokens
function lexer(input) {
  const tokens = [];
  let cursor = 0;

  while (cursor < input.length) {
    let char = input[cursor];

    // Skip whitespace
    if (/\s/.test(char)) {
      cursor++;
      continue;
    }

    // Handle identifiers and keywords
    if (/[a-zA-Z]/.test(char)) {
      let word = "";
      while (cursor < input.length && /[a-zA-Z0-9]/.test(input[cursor])) {
        word += input[cursor];
        cursor++;
      }
      tokens.push({ type: keywords[word] || "ID", value: word });
      continue;
    }

    // Handle numbers
    if (/[0-9]/.test(char)) {
      let number = "";
      while (cursor < input.length && /[0-9]/.test(input[cursor])) {
        number += input[cursor];
        cursor++;
      }
      tokens.push({ type: "NUMBER", value: parseInt(number) });
      continue;
    }

    // Handle strings
    if (char === '"') {
      let str = "";
      cursor++; // Skip opening quote
      while (cursor < input.length && input[cursor] !== '"') {
        str += input[cursor];
        cursor++;
      }
      if (cursor >= input.length) {
        throw new Error("Unterminated string literal");
      }
      cursor++; // Skip closing quote
      tokens.push({ type: "STRING", value: str });
      continue;
    }

    if (char === "'") {
      let str = "";
      cursor++; // Skip opening quote
      while (cursor < input.length && input[cursor] !== "'") {
        str += input[cursor];
        cursor++;
      }
      if (cursor >= input.length) {
        throw new Error("Unterminated string literal");
      }
      cursor++; // Skip closing quote
      tokens.push({ type: "STRING", value: str });
      continue;
    }

    // Handle operators
    if (/[=+\-*/<>]/.test(char)) {
      let op = char;
      if (cursor + 1 < input.length && input[cursor + 1] === "=") {
        op += "=";
        cursor++;
      }
      tokens.push({ type: "OPERATOR", value: op });
      cursor++;
      continue;
    }

    // Handle semicolons
    if (char === ";") {
      tokens.push({ type: "SEMICOLON", value: ";" });
      cursor++;
      continue;
    }

    // Handle brackets for code blocks
    if (char === "{") {
      tokens.push({ type: "OPEN_BRACE", value: "{" });
      cursor++;
      continue;
    }

    if (char === "}") {
      tokens.push({ type: "CLOSE_BRACE", value: "}" });
      cursor++;
      continue;
    }

    throw new Error(`Unexpected character: ${char} at position ${cursor}`);
  }

  return tokens;
}

// Parser: Converts tokens into AST
function parser(tokens) {
  const ast = { type: "PROGRAM", body: [] };
  let index = 0;

  function nextToken() {
    return tokens[index] || null;
  }

  function peek(offset = 1) {
    return tokens[index + offset] || null;
  }

  function consume(type) {
    const token = nextToken();
    if (!token) {
      throw new Error(`Expected token type ${type}, got END_OF_INPUT`);
    }
    if (type && token.type !== type) {
      throw new Error(`Expected token type ${type}, got ${token.type}`);
    }
    index++;
    return token;
  }

  function optionalConsume(type) {
    if (nextToken() && nextToken().type === type) {
      return consume(type);
    }
    return null;
  }

  // Enhanced expression parser to handle binary operations
  function parseExpression() {
    let left = parsePrimary();

    // Check if there's an operator following the primary expression
    if (
      nextToken() &&
      nextToken().type === "OPERATOR" &&
      ["+", "-", "*", "/"].includes(nextToken().value)
    ) {
      let operator = consume("OPERATOR");
      let right = parsePrimary();

      return {
        type: "BINARY_EXPRESSION",
        operator: operator.value,
        left,
        right,
      };
    }

    return left;
  }

  function parsePrimary() {
    let token = nextToken();
    if (!token) throw new Error("Unexpected end of input");

    if (
      token.type === "NUMBER" ||
      token.type === "STRING" ||
      token.type === "ID"
    ) {
      index++;
      return token;
    }

    throw new Error(`Unexpected token in expression: ${token.type}`);
  }

  function parseCondition() {
    let left = parsePrimary();
    let operator = nextToken();
    if (!operator || operator.type !== "OPERATOR") {
      throw new Error("Expected operator in condition");
    }
    index++;
    let right = parsePrimary();
    return { type: "CONDITION", left, operator, right };
  }

  function parseStatement() {
    let token = nextToken();
    if (!token) return null;

    // Variable declaration
    if (token.type === "VAR") {
      index++;
      let varName = consume("ID");
      let equals = consume("OPERATOR");
      if (equals.value !== "=") {
        throw new Error("Expected '=' in variable declaration");
      }
      let value = parseExpression();
      optionalConsume("SEMICOLON"); // Make semicolons optional
      return { type: "VAR_DECLARATION", name: varName.value, value };
    }

    // Print statement
    if (token.type === "PRINT") {
      index++;
      let value = parseExpression();
      optionalConsume("SEMICOLON"); // Make semicolons optional
      return { type: "PRINT", value };
    }

    // If statement
    if (token.type === "IF") {
      index++;
      let condition = parseCondition();
      let body = [];

      // Optional brace handling
      if (nextToken() && nextToken().type === "OPEN_BRACE") {
        consume("OPEN_BRACE");
        body = parseBlock();
      } else {
        // Single statement without braces
        const statement = parseStatement();
        if (statement) body.push(statement);
      }

      let elseIfBlocks = [];
      while (nextToken() && nextToken().type === "ELSE_IF") {
        index++;
        let elseIfCondition = parseCondition();
        let elseIfBody = [];

        // Optional brace handling
        if (nextToken() && nextToken().type === "OPEN_BRACE") {
          consume("OPEN_BRACE");
          elseIfBody = parseBlock();
        } else {
          // Single statement without braces
          const statement = parseStatement();
          if (statement) elseIfBody.push(statement);
        }

        elseIfBlocks.push({ condition: elseIfCondition, body: elseIfBody });
      }

      let elseBlock = null;
      if (nextToken() && nextToken().type === "ELSE") {
        index++;
        elseBlock = [];

        // Optional brace handling
        if (nextToken() && nextToken().type === "OPEN_BRACE") {
          consume("OPEN_BRACE");
          elseBlock = parseBlock();
        } else {
          // Single statement without braces
          const statement = parseStatement();
          if (statement) elseBlock.push(statement);
        }
      }

      return { type: "IF_STATEMENT", condition, body, elseIfBlocks, elseBlock };
    }

    // While loop
    if (token.type === "WHILE") {
      index++;
      let condition = parseCondition();

      // Check for LOOP_START token
      if (nextToken() && nextToken().type === "LOOP_START") {
        consume("LOOP_START");
      }

      let body = [];
      // Optional brace handling
      if (nextToken() && nextToken().type === "OPEN_BRACE") {
        consume("OPEN_BRACE");
        body = parseBlock();
      } else {
        // Single statement without braces
        const statement = parseStatement();
        if (statement) body.push(statement);
      }

      return { type: "WHILE_LOOP", condition, body };
    }

    // If we get here, try to handle an identifier expression (might be a variable reference)
    if (token.type === "ID") {
      let id = consume("ID");

      // Check if it's an assignment
      if (
        nextToken() &&
        nextToken().type === "OPERATOR" &&
        nextToken().value === "="
      ) {
        consume("OPERATOR"); // Consume the equals
        let value = parseExpression(); // This now handles complex expressions
        optionalConsume("SEMICOLON"); // Make semicolons optional
        return { type: "ASSIGNMENT", name: id.value, value };
      }

      // Otherwise, it's just an expression statement
      optionalConsume("SEMICOLON"); // Make semicolons optional
      return {
        type: "EXPRESSION_STATEMENT",
        expression: { type: "ID", value: id.value },
      };
    }

    // Skip unexpected tokens
    index++;
    return null;
  }

  function parseBlock() {
    const statements = [];

    while (index < tokens.length) {
      if (nextToken() && nextToken().type === "CLOSE_BRACE") {
        index++; // Consume the closing brace
        break;
      }

      const statement = parseStatement();
      if (statement) {
        statements.push(statement);
      }
    }

    return statements;
  }

  // Parse the program
  while (index < tokens.length) {
    const statement = parseStatement();
    if (statement) {
      ast.body.push(statement);
    }
  }

  return ast;
}

// JavaScript Code Generator
function generateJavaScript(ast) {
  let code = "";

  function generateExpression(expr) {
    if (expr.type === "NUMBER") return expr.value;
    if (expr.type === "STRING") return `"${expr.value}"`;
    if (expr.type === "ID") return expr.value;
    if (expr.type === "BINARY_EXPRESSION") {
      let left = generateExpression(expr.left);
      let right = generateExpression(expr.right);
      return `${left} ${expr.operator} ${right}`;
    }
    throw new Error(`Unknown expression type: ${expr.type}`);
  }

  function generateCondition(condition) {
    let left = generateExpression(condition.left);
    let right = generateExpression(condition.right);
    let op = condition.operator.value;

    return `${left} ${op} ${right}`;
  }

  function generateStatement(node, indent = "") {
    switch (node.type) {
      case "VAR_DECLARATION":
        return `${indent}let ${node.name} = ${generateExpression(node.value)};`;

      case "ASSIGNMENT":
        return `${indent}${node.name} = ${generateExpression(node.value)};`;

      case "EXPRESSION_STATEMENT":
        return `${indent}${generateExpression(node.expression)};`;

      case "PRINT":
        return `${indent}console.log(${generateExpression(node.value)});`;

      case "IF_STATEMENT": {
        let result = `${indent}if (${generateCondition(node.condition)}) {\n`;

        // Generate the 'if' body
        for (const statement of node.body) {
          result += `${generateStatement(statement, indent + "  ")}\n`;
        }

        // Generate 'else if' blocks
        if (node.elseIfBlocks && node.elseIfBlocks.length > 0) {
          for (const elseIf of node.elseIfBlocks) {
            result += `${indent}} else if (${generateCondition(elseIf.condition)}) {\n`;
            for (const statement of elseIf.body) {
              result += `${generateStatement(statement, indent + "  ")}\n`;
            }
          }
        }

        // Generate 'else' block
        if (node.elseBlock) {
          result += `${indent}} else {\n`;
          for (const statement of node.elseBlock) {
            result += `${generateStatement(statement, indent + "  ")}\n`;
          }
        }

        result += `${indent}}`;
        return result;
      }

      case "WHILE_LOOP": {
        let result = `${indent}while (${generateCondition(node.condition)}) {\n`;

        // Generate the loop body
        for (const statement of node.body) {
          result += `${generateStatement(statement, indent + "  ")}\n`;
        }

        result += `${indent}}`;
        return result;
      }

      default:
        return `${indent}// Unsupported statement type: ${node.type}`;
    }
  }

  // Add a simple runtime header
  code += "// Generated JavaScript code\n\n";

  // Generate code for each statement in the program
  for (const statement of ast.body) {
    code += generateStatement(statement) + "\n";
  }

  return code;
}

function generateC(ast) {
  let code = "#include <stdio.h>\n\nint main() {\n";

  function generateExpression(expr) {
    if (expr.type === "NUMBER") return expr.value;
    if (expr.type === "STRING") return `\"${expr.value}\"`;
    if (expr.type === "ID") return expr.value;
    if (expr.type === "BINARY_EXPRESSION") {
      let left = generateExpression(expr.left);
      let right = generateExpression(expr.right);
      return `${left} ${expr.operator} ${right}`;
    }
    throw new Error(`Unknown expression type: ${expr.type}`);
  }

  function generateCondition(condition) {
    let left = generateExpression(condition.left);
    let right = generateExpression(condition.right);
    let op = condition.operator.value;
    return `${left} ${op} ${right}`;
  }

  function generateStatement(node, indent = "  ") {
    switch (node.type) {
      case "VAR_DECLARATION":
        if (node.value.type == "STRING")
          return `${indent}char* ${node.name} = ${generateExpression(node.value)};`;
        if (node.value.type == "NUMBER")
          return `${indent}int ${node.name} = ${generateExpression(node.value)};`;

      case "ASSIGNMENT":
        return `${indent}${node.name} = ${generateExpression(node.value)};`;

      case "EXPRESSION_STATEMENT":
        return `${indent}${generateExpression(node.expression)};`;

      case "PRINT":
        return `${indent}printf(\"%d\\n\", ${generateExpression(node.value)});`;

      case "IF_STATEMENT": {
        let result = `${indent}if (${generateCondition(node.condition)}) {\n`;
        for (const statement of node.body) {
          result += `${generateStatement(statement, indent + "  ")}\n`;
        }

        if (node.elseIfBlocks && node.elseIfBlocks.length > 0) {
          for (const elseIf of node.elseIfBlocks) {
            result += `${indent}} else if (${generateCondition(elseIf.condition)}) {\n`;
            for (const statement of elseIf.body) {
              result += `${generateStatement(statement, indent + "  ")}\n`;
            }
          }
        }

        if (node.elseBlock) {
          result += `${indent}} else {\n`;
          for (const statement of node.elseBlock) {
            result += `${generateStatement(statement, indent + "  ")}\n`;
          }
        }

        result += `${indent}}`;
        return result;
      }

      case "WHILE_LOOP": {
        let result = `${indent}while (${generateCondition(node.condition)}) {\n`;
        for (const statement of node.body) {
          result += `${generateStatement(statement, indent + "  ")}\n`;
        }
        result += `${indent}}`;
        return result;
      }

      default:
        return `${indent}// Unsupported statement type: ${node.type}`;
    }
  }

  for (const statement of ast.body) {
    code += generateStatement(statement) + "\n";
  }

  code += "  return 0;\n}";
  return code;
}

function generateCpp(ast) {
  let code = "#include <iostream>\nusing namespace std;\n\nint main() {\n";

  function generateExpression(expr) {
    if (expr.type === "NUMBER") return expr.value;
    if (expr.type === "STRING") return `\"${expr.value}\"`;
    if (expr.type === "ID") return expr.value;
    if (expr.type === "BINARY_EXPRESSION") {
      let left = generateExpression(expr.left);
      let right = generateExpression(expr.right);
      return `${left} ${expr.operator} ${right}`;
    }
    throw new Error(`Unknown expression type: ${expr.type}`);
  }

  function generateCondition(condition) {
    let left = generateExpression(condition.left);
    let right = generateExpression(condition.right);
    let op = condition.operator.value;
    return `${left} ${op} ${right}`;
  }

  function generateStatement(node, indent = "  ") {
    switch (node.type) {
      case "VAR_DECLARATION":
        if (node.value.type == "STRING")
          return `${indent}string ${node.name} = ${generateExpression(node.value)};`;
        if (node.value.type == "NUMBER")
          return `${indent}int ${node.name} = ${generateExpression(node.value)};`;

      case "ASSIGNMENT":
        return `${indent}${node.name} = ${generateExpression(node.value)};`;

      case "EXPRESSION_STATEMENT":
        return `${indent}${generateExpression(node.expression)};`;

      case "PRINT":
        return `${indent}cout << ${generateExpression(node.value)} << endl;`;

      case "IF_STATEMENT": {
        let result = `${indent}if (${generateCondition(node.condition)}) {\n`;
        for (const statement of node.body) {
          result += `${generateStatement(statement, indent + "  ")}\n`;
        }

        if (node.elseIfBlocks && node.elseIfBlocks.length > 0) {
          for (const elseIf of node.elseIfBlocks) {
            result += `${indent}} else if (${generateCondition(elseIf.condition)}) {\n`;
            for (const statement of elseIf.body) {
              result += `${generateStatement(statement, indent + "  ")}\n`;
            }
          }
        }

        if (node.elseBlock) {
          result += `${indent}} else {\n`;
          for (const statement of node.elseBlock) {
            result += `${generateStatement(statement, indent + "  ")}\n`;
          }
        }

        result += `${indent}}`;
        return result;
      }

      case "WHILE_LOOP": {
        let result = `${indent}while (${generateCondition(node.condition)}) {\n`;
        for (const statement of node.body) {
          result += `${generateStatement(statement, indent + "  ")}\n`;
        }
        result += `${indent}}`;
        return result;
      }

      default:
        return `${indent}// Unsupported statement type: ${node.type}`;
    }
  }

  for (const statement of ast.body) {
    code += generateStatement(statement) + "\n";
  }

  code += "  return 0;\n}";
  return code;
}

function generateGo(ast) {
  let code = 'package main\n\nimport "fmt"\n\nfunc main() {\n';

  function generateExpression(expr) {
    if (expr.type === "NUMBER") return expr.value;
    if (expr.type === "STRING") return `\"${expr.value}\"`;
    if (expr.type === "ID") return expr.value;
    if (expr.type === "BINARY_EXPRESSION") {
      let left = generateExpression(expr.left);
      let right = generateExpression(expr.right);
      return `${left} ${expr.operator} ${right}`;
    }
    throw new Error(`Unknown expression type: ${expr.type}`);
  }

  function generateCondition(condition) {
    let left = generateExpression(condition.left);
    let right = generateExpression(condition.right);
    let op = condition.operator.value;
    return `${left} ${op} ${right}`;
  }

  function generateStatement(node, indent = "  ") {
    switch (node.type) {
      case "VAR_DECLARATION":
        return `${indent}${node.name} := ${generateExpression(node.value)}`;

      case "ASSIGNMENT":
        return `${indent}${node.name} = ${generateExpression(node.value)}`;

      case "EXPRESSION_STATEMENT":
        return `${indent}${generateExpression(node.expression)}`;

      case "PRINT":
        return `${indent}fmt.Println(${generateExpression(node.value)})`;

      case "IF_STATEMENT": {
        let result = `${indent}if ${generateCondition(node.condition)} {\n`;
        for (const statement of node.body) {
          result += `${generateStatement(statement, indent + "  ")}\n`;
        }

        if (node.elseIfBlocks && node.elseIfBlocks.length > 0) {
          for (const elseIf of node.elseIfBlocks) {
            result += `${indent}} else if ${generateCondition(elseIf.condition)} {\n`;
            for (const statement of elseIf.body) {
              result += `${generateStatement(statement, indent + "  ")}\n`;
            }
          }
        }

        if (node.elseBlock) {
          result += `${indent}} else {\n`;
          for (const statement of node.elseBlock) {
            result += `${generateStatement(statement, indent + "  ")}\n`;
          }
        }

        result += `${indent}}`;
        return result;
      }

      case "WHILE_LOOP": {
        let result = `${indent}for ${generateCondition(node.condition)} {\n`;
        for (const statement of node.body) {
          result += `${generateStatement(statement, indent + "  ")}\n`;
        }
        result += `${indent}}`;
        return result;
      }

      default:
        return `${indent}// Unsupported statement type: ${node.type}`;
    }
  }

  for (const statement of ast.body) {
    code += generateStatement(statement) + "\n";
  }

  code += "}";
  return code;
}

function generateRust(ast) {
  let code = "fn main() {\n";

  function generateExpression(expr) {
    if (expr.type === "NUMBER") return expr.value;
    if (expr.type === "STRING") return `String::from(\"${expr.value}\")`;
    if (expr.type === "ID") return expr.value;
    if (expr.type === "BINARY_EXPRESSION") {
      let left = generateExpression(expr.left);
      let right = generateExpression(expr.right);
      return `${left} ${expr.operator} ${right}`;
    }
    throw new Error(`Unknown expression type: ${expr.type}`);
  }

  function generateCondition(condition) {
    let left = generateExpression(condition.left);
    let right = generateExpression(condition.right);
    let op = condition.operator.value;
    return `${left} ${op} ${right}`;
  }

  function generateStatement(node, indent = "  ") {
    switch (node.type) {
      case "VAR_DECLARATION":
        return `${indent}let mut ${node.name} = ${generateExpression(node.value)};`;

      case "ASSIGNMENT":
        return `${indent}${node.name} = ${generateExpression(node.value)};`;

      case "EXPRESSION_STATEMENT":
        return `${indent}${generateExpression(node.expression)};`;

      case "PRINT":
        return `${indent}println!(\"{}\", ${generateExpression(node.value)});`;

      case "IF_STATEMENT": {
        let result = `${indent}if ${generateCondition(node.condition)} {\n`;
        for (const statement of node.body) {
          result += `${generateStatement(statement, indent + "  ")}\n`;
        }

        if (node.elseIfBlocks && node.elseIfBlocks.length > 0) {
          for (const elseIf of node.elseIfBlocks) {
            result += `${indent}} else if ${generateCondition(elseIf.condition)} {\n`;
            for (const statement of elseIf.body) {
              result += `${generateStatement(statement, indent + "  ")}\n`;
            }
          }
        }

        if (node.elseBlock) {
          result += `${indent}} else {\n`;
          for (const statement of node.elseBlock) {
            result += `${generateStatement(statement, indent + "  ")}\n`;
          }
        }

        result += `${indent}}`;
        return result;
      }

      case "WHILE_LOOP": {
        let result = `${indent}while ${generateCondition(node.condition)} {\n`;
        for (const statement of node.body) {
          result += `${generateStatement(statement, indent + "  ")}\n`;
        }
        result += `${indent}}`;
        return result;
      }

      default:
        return `${indent}// Unsupported statement type: ${node.type}`;
    }
  }

  for (const statement of ast.body) {
    code += generateStatement(statement) + "\n";
  }

  code += "}";
  return code;
}

function generateKotlin(ast) {
  let code = "fun main() {\n";

  function generateExpression(expr) {
    if (expr.type === "NUMBER") return expr.value;
    if (expr.type === "STRING") return `"${expr.value}"`;
    if (expr.type === "ID") return expr.value;
    if (expr.type === "BINARY_EXPRESSION") {
      let left = generateExpression(expr.left);
      let right = generateExpression(expr.right);
      return `${left} ${expr.operator} ${right}`;
    }
    throw new Error(`Unknown expression type: ${expr.type}`);
  }

  function generateCondition(condition) {
    let left = generateExpression(condition.left);
    let right = generateExpression(condition.right);
    return `${left} ${condition.operator.value} ${right}`;
  }

  function generateStatement(node, indent = "    ") {
    switch (node.type) {
      case "VAR_DECLARATION":
        return `${indent}var ${node.name} = ${generateExpression(node.value)}`;

      case "ASSIGNMENT":
        return `${indent}${node.name} = ${generateExpression(node.value)}`;

      case "EXPRESSION_STATEMENT":
        return `${indent}${generateExpression(node.expression)}`;

      case "PRINT":
        return `${indent}println(${generateExpression(node.value)})`;

      case "IF_STATEMENT": {
        let result = `${indent}if (${generateCondition(node.condition)}) {\n`;
        for (const statement of node.body) {
          result += `${generateStatement(statement, indent + "    ")}\n`;
        }

        if (node.elseIfBlocks && node.elseIfBlocks.length > 0) {
          for (const elseIf of node.elseIfBlocks) {
            result += `${indent}} else if (${generateCondition(elseIf.condition)}) {\n`;
            for (const statement of elseIf.body) {
              result += `${generateStatement(statement, indent + "    ")}\n`;
            }
          }
        }

        if (node.elseBlock) {
          result += `${indent}} else {\n`;
          for (const statement of node.elseBlock) {
            result += `${generateStatement(statement, indent + "    ")}\n`;
          }
        }

        result += `${indent}}`;
        return result;
      }

      case "WHILE_LOOP": {
        let result = `${indent}while (${generateCondition(node.condition)}) {\n`;
        for (const statement of node.body) {
          result += `${generateStatement(statement, indent + "    ")}\n`;
        }
        result += `${indent}}`;
        return result;
      }

      default:
        return `${indent}// Unsupported statement type: ${node.type}`;
    }
  }

  for (const statement of ast.body) {
    code += generateStatement(statement) + "\n";
  }

  code += "}";
  return code;
}

function generateJava(ast) {
  let code =
    "public class Main {\n  public static void main(String[] args) {\n";

  function generateExpression(expr) {
    if (expr.type === "NUMBER") return expr.value;
    if (expr.type === "STRING") return `"${expr.value}"`;
    if (expr.type === "ID") return expr.value;
    if (expr.type === "BINARY_EXPRESSION") {
      let left = generateExpression(expr.left);
      let right = generateExpression(expr.right);
      return left + " " + expr.operator + " " + right;
    }
    throw new Error(`Unknown expression type: ${expr.type}`);
  }

  function generateCondition(condition) {
    let left = generateExpression(condition.left);
    let right = generateExpression(condition.right);
    let op = condition.operator.value;
    return left + " " + op + " " + right;
  }

  function generateStatement(node, indent = "    ") {
    switch (node.type) {
      case "VAR_DECLARATION":
        if (node.value.type == "STRING")
          return `${indent}String ${node.name} = ${generateExpression(node.value)};`;
        if (node.value.type == "NUMBER")
          return `${indent}int ${node.name} = ${generateExpression(node.value)};`;

      case "ASSIGNMENT":
        return `${indent}${node.name} = ${generateExpression(node.value)};`;

      case "EXPRESSION_STATEMENT":
        return `${indent}${generateExpression(node.expression)};`;

      case "PRINT":
        return `${indent}System.out.println(${generateExpression(node.value)});`;

      case "IF_STATEMENT": {
        let result = `${indent}if (${generateCondition(node.condition)}) {\n`;
        for (const statement of node.body) {
          result += `${generateStatement(statement, indent + "    ")}\n`;
        }

        if (node.elseIfBlocks && node.elseIfBlocks.length > 0) {
          for (const elseIf of node.elseIfBlocks) {
            result += `${indent}} else if (${generateCondition(elseIf.condition)}) {\n`;
            for (const statement of elseIf.body) {
              result += `${generateStatement(statement, indent + "    ")}\n`;
            }
          }
        }

        if (node.elseBlock) {
          result += `${indent}} else {\n`;
          for (const statement of node.elseBlock) {
            result += `${generateStatement(statement, indent + "    ")}\n`;
          }
        }

        result += `${indent}}`;
        return result;
      }

      case "WHILE_LOOP": {
        let result = `${indent}while (${generateCondition(node.condition)}) {\n`;
        for (const statement of node.body) {
          result += `${generateStatement(statement, indent + "    ")}\n`;
        }
        result += `${indent}}`;
        return result;
      }

      default:
        return `${indent}// Unsupported statement type: ${node.type}`;
    }
  }

  for (const statement of ast.body) {
    code += generateStatement(statement) + "\n";
  }

  code += "  }\n}";
  return code;
}

function generatePython(ast) {
  let code = "def main():\n";

  function generateExpression(expr) {
    if (expr.type === "NUMBER") return expr.value;
    if (expr.type === "STRING") return `"${expr.value}"`;
    if (expr.type === "ID") return expr.value;
    if (expr.type === "BINARY_EXPRESSION") {
      let left = generateExpression(expr.left);
      let right = generateExpression(expr.right);
      return `${left} ${expr.operator} ${right}`;
    }
    throw new Error(`Unknown expression type: ${expr.type}`);
  }

  function generateCondition(condition) {
    let left = generateExpression(condition.left);
    let right = generateExpression(condition.right);
    let op = condition.operator.value;
    return `${left} ${op} ${right}`;
  }

  function generateStatement(node, indent = "    ") {
    switch (node.type) {
      case "VAR_DECLARATION":
        return `${indent}${node.name} = ${generateExpression(node.value)}`;

      case "ASSIGNMENT":
        return `${indent}${node.name} = ${generateExpression(node.value)}`;

      case "EXPRESSION_STATEMENT":
        return `${indent}${generateExpression(node.expression)}`;

      case "PRINT":
        return `${indent}print(${generateExpression(node.value)})`;

      case "IF_STATEMENT": {
        let result = `${indent}if ${generateCondition(node.condition)}:\n`;
        for (const statement of node.body) {
          result += `${generateStatement(statement, indent + "    ")}\n`;
        }

        if (node.elseIfBlocks && node.elseIfBlocks.length > 0) {
          for (const elseIf of node.elseIfBlocks) {
            result += `${indent}elif ${generateCondition(elseIf.condition)}:\n`;
            for (const statement of elseIf.body) {
              result += `${generateStatement(statement, indent + "    ")}\n`;
            }
          }
        }

        if (node.elseBlock) {
          result += `${indent}else:\n`;
          for (const statement of node.elseBlock) {
            result += `${generateStatement(statement, indent + "    ")}\n`;
          }
        }

        return result;
      }

      case "WHILE_LOOP": {
        let result = `${indent}while ${generateCondition(node.condition)}:\n`;
        for (const statement of node.body) {
          result += `${generateStatement(statement, indent + "    ")}\n`;
        }
        return result;
      }

      default:
        return `${indent}# Unsupported statement type: ${node.type}`;
    }
  }

  for (const statement of ast.body) {
    code += generateStatement(statement) + "\n";
  }

  code += '\nif __name__ == "__main__":\n    main()';
  return code;
}

// CLI Handling
function main() {
  const args = process.argv.slice(2);
  let fileName, outputFileName;

  if (args.length === 0) {
    console.error("Usage: node compiler.js <file.ye> [-o <output.file>");
    process.exit(1);
  }

  const fileIndex = args.findIndex((arg) => !arg.startsWith("-"));
  if (fileIndex === -1) {
    console.error("Error: No input file provided.");
    process.exit(1);
  }

  fileName = args[fileIndex];

  const outputFlagIndex = args.indexOf("-o");
  if (outputFlagIndex !== -1) {
    if (outputFlagIndex + 1 >= args.length) {
      console.error("Error: No output file specified after -o flag.");
      process.exit(1);
    }
    outputFileName = args[outputFlagIndex + 1];
  } else {
    outputFileName = fileName.replace(/\.[^.]+$/, ".js");
  }

  const extension = outputFileName.split(".").pop();

  const languageGenerators = {
    js: generateJavaScript,
    c: generateC,
    cpp: generateCpp,
    rs: generateRust,
    kt: generateKotlin,
    java: generateJava,
    go: generateGo,
    py: generatePython,
  };

  fs.readFile(fileName, "utf-8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      process.exit(1);
    }

    try {
      const tokens = lexer(data);
      console.log("Tokens:", tokens);

      const ast = parser(tokens);
      console.log("AST:", JSON.stringify(ast, null, 2));

      if (!(extension in languageGenerators)) {
        console.error("❌ Unsupported output format: " + extension);
        process.exit(1);
      }

      const generatedCode = languageGenerators[extension](ast);

      console.log("\nGenerated Code:\n");
      console.log(generatedCode);

      // Save the generated code to the specified output file
      fs.writeFileSync(outputFileName, generatedCode);
      console.log(`\nCode saved to ${outputFileName}`);
    } catch (error) {
      console.error("❌ Compilation Error:", error.message);
    }
  });
}

main();
