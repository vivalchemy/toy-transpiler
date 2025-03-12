# Toy Compiler

A simple compiler that translates code written in the "Kanye" language (with `.ye` extension) into various target languages.

## Contributors

- [Vivian Ludrick (9914)](https://github.com/vivalchemy) - ast
- [Rohit Patra (9928)](https://github.com/Rohitpatra007) - tokenizer
- [Badal Singh (9933)](https://github.com/BadalSingh2) - generate functions some language
- [Ronit Naik (9924)](https://github.com/RonitNaik122) - generate functions some language
- [Pratyay Koley (9909)](https://github.com/PratyayKoley) - generate functions some language

## Overview

This compiler takes code written in a simplified language with Indian/Hindi-inspired keywords and translates it into several popular programming languages including JavaScript, Python, C, C++, Rust, Go, Java, and Kotlin.

## How the Compiler Works

The compilation process follows these main steps:

1. **Lexical Analysis (Lexer)**: Converts the source code into tokens
2. **Syntactic Analysis (Parser)**: Converts tokens into an Abstract Syntax Tree (AST)
3. **Code Generation**: Transforms the AST into the target language code

### Supported Language Keywords

The Kanye language uses the following keywords:

| Keyword | Meaning     | Equivalent     |
|---------|-------------|----------------|
| `ye`    | Variable    | `var/let`      |
| `bol`   | Print       | `print/cout`   |
| `agar`  | If          | `if`           |
| `yafir` | Else If     | `else if`      |
| `varna` | Else        | `else`         |
| `jabtak`| While       | `while`        |
| `tabtak`| Loop Start  | `{`            |

### Supported Features

- Variable declarations and assignments
- Basic arithmetic operations
- String literals
- Conditional statements (if-else if-else)
- While loops
- Print statements

## Installation and Setup

### Prerequisites

- Node.js (to run the compiler)
- Target language compilers/interpreters for testing (go, gcc, g++, javac, python, rustc, etc.)
- Bun/Deno (for building the binary)

### Building the Compiler

> [!NOTE]
> You can directly run the code itself without building it first.
> This is useful for testing and development purposes.

```bash
make bin
```

This will create an executable called `kanye`.

## Usage

### Basic Usage

```bash
./kanye input.ye -o output.js
```

> [!NOTE]
> To directly run the code instead of building it, use `node compiler.js input.ye -o output.js`.

This compiles the `input.ye` file to JavaScript and saves it to `output.js`. The output file format is based on the file extension.

### Supported Output Formats

Change the extension to generate code in different languages:

- `.js` - JavaScript
- `.py` - Python
- `.c` - C
- `.cpp` - C++
- `.go` - Go
- `.rs` - Rust
- `.java` - Java
- `.kt` - Kotlin

### Running Tests

The included Makefile provides commands to compile and run the example code in various languages:

```bash
# Test all supported languages
make test

# Test specific language
make test.js
make test.py
make test.c
make test.cpp
make test.go
make test.rs
make test.java
make test.kt

# Clean up generated files
make clean
```

## Example Code

Here's a simple example in the Kanye language:

```
ye a = 10
ye b = 20
ye message = "Hello World"

bol message
bol a

agar a < b {
  bol "a is less than b"
  ye c = 30
  bol c
} yafir a > b {
  bol "a is greater than b"
} varna {
  bol "a is equal to b"
}

jabtak a < b tabtak {
  bol a
  a = a + 2
}

ye result = 100
bol result
```

This code:
1. Declares variables
2. Prints messages
3. Has conditional branching
4. Contains a while loop

## Project Structure

- `compiler.js` - The main compiler code
- `input.ye` - Example input file
- `Makefile` - Build and test automation

## How the Compiler Works in Detail

### 1. Lexical Analysis

The lexer (`lexer` function) scans the source code character by character and produces tokens. For example, the line `ye a = 10` is broken down into:

```javascript
[
  { type: "VAR", value: "ye" },
  { type: "ID", value: "a" },
  { type: "OPERATOR", value: "=" },
  { type: "NUMBER", value: 10 }
]
```

### 2. Syntactic Analysis

The parser (`parser` function) takes these tokens and builds an Abstract Syntax Tree (AST) representing the structure of the program. We use a **recursive descent parser** to handle nesting and operator precedence. The AST for the same line might look like:

```javascript
{
  "type": "VAR_DECLARATION",
  "name": "a",
  "value": { "type": "NUMBER", "value": 10 }
}
```

### 3. Code Generation

Finally, one of the code generators (e.g., `generateJavaScript`, `generatePython`, etc.) takes the AST and transforms it into the target language's syntax.

For example, the JavaScript output would be:
```javascript
let a = 10;
```

And the Python output would be:
```python
a = 10
```

### 4. Technical Challenges and Solutions

1. **Parser Complexity**: Handling nested expressions and control structures.  
   Solution: Implemented recursive descent parsing with separate functions for different language constructs.

2. **Multi-language Support**: Maintaining consistent semantics across different target languages.  
   Solution: Designed a flexible AST that captures the essential semantics, independent of target language syntax.

3. **Error Handling**: Providing meaningful error messages for compilation errors.  
   Solution: Implemented basic error handling with specific error messages for syntax and semantic issues.

### 5. Appendix A: Full Compiler Code

The complete compiler implementation is available in the attached source file. The codebase is structured as follows:

- Lexer (lexer function)
- Parser (parser function and related helpers)
- Code generators (multiple functions for different target languages)
- CLI handling (command-line interface implementation)
