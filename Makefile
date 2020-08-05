NODE_MODULES_TOP = ./node_modules
NODE_BINS = $(NODE_MODULES_TOP)/.bin

.PHONY: all comb lint clean compile

all: clean comb lint compile

clean:
	rm -rf ./dist
	mkdir -p ./dist

comb:
	$(NODE_BINS)/prettier --write "./src/**/*.{js,ts,tsx,json}"

lint:
	$(NODE_BINS)/eslint ./src/*.ts --fix

assets:
	$(NODE_BINS)/copyfiles -a -u 1 "./src/**/*.yml" ./dist
	$(NODE_BINS)/copyfiles -a -u 1 "./src/**/*.json" ./dist

compile:
	$(NODE_BINS)/tsc --project tsconfig.json
