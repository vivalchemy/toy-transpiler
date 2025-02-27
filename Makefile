.PHONY: bin test clean

bin:
	bun build ./compiler.js --compile --outfile kanye

test.go: bin
	./kanye input.ye -o $@
	go run $@

test.js: bin
	./kanye input.ye -o $@
	node $@

test.c: bin
	./kanye input.ye -o  $@
	gcc $@ -o test
	./test

test.cpp: bin
	./kanye input.ye -o  $@
	g++ $@ -o test
	./test

test.java: bin
	./kanye input.ye -o Main.java
	javac Main.java
	java Main

test.py: bin
	./kanye input.ye -o $@
	python3  $@

test.rs: bin
	./kanye input.ye -o $@
	rustc $@ -o test
	./test

test.kt: bin
	./kanye input.ye -o $@

test: test.go test.js test.c test.java test.py test.rs test.kt

clean:
	rm -f kanye
	rm -f test.*
