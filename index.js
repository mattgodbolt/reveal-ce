function textToLines(textContent) {
  return textContent.split("\n");
}


function trim(source) {
  while (source.startsWith("\n")) {
    source = source.slice(1, source.length);
  }
  while (source.endsWith("\n\n")) {
    source = source.slice(0, source.length - 1);
  }
  return source;
}

export default () => ({
  id: "compiler-explorer",
  init: (deck) => {
    const ce_nodes = deck.getSlidesElement().querySelectorAll("code.cpp");

    for (let i = 0, len = ce_nodes.length; i < len; i++) {
      const element = ce_nodes[i];
      let compiler = "g142";
      let options = "-O2 -march=haswell";
      const lines = textToLines(element.textContent);
      let source = "";
      let displaySource = "";
      const configMatcher = /^\s*\/\/\/\s*([^:]+):(.*)$/;
      const hideMatcher = /^\s*\/\/\/\s*((un)?hide)\s*$/;
      let skipDisplay = false;
      let hide = false;
      for (const line of lines) {
        let match = line.match(configMatcher);
        if (match) {
          compiler = match[1];
          options = match[2];
        } else {
          match = line.match(hideMatcher);
          if (match) {
            hide = match[1] === "hide";
            continue;
          }
          if (line === "// setup") {
            skipDisplay = true;
          } else if (line[0] !== " ") {
            skipDisplay = false;
          }

          source += line + "\n";
          if (!skipDisplay && !hide) displaySource += line + "\n";
          if (line.length > 50) {
            console.error(`Line too long: "${line}"`);
          }
        }
      }


      displaySource = trim(displaySource);
      source = trim(source);
      options += " -Wall -Wextra -pedantic";
      const content = [];
      content.push({
        type: "component",
        componentName: "codeEditor",
        componentState: {
          id: 1,
          source: source,
          options: { compileOnChange: true, colouriseAsm: true },
          fontScale: 2.5,
          lang: "c++",
        },
      });
      content.push({
        type: "component",
        componentName: "compiler",
        componentState: {
          source: 1,
          filters: {
            commentOnly: true,
            directives: true,
            intel: true,
            labels: true,
            trim: true,
          },
          options: options,
          compiler: compiler,
          fontScale: 3.0,
        },
      });
      const obj = {
        version: 4,
        content: [{ type: "row", content: content }],
      };
      const ceFragment = encodeURIComponent(JSON.stringify(obj));

      const config = deck.getConfig().compilerExplorer ? deck.getConfig().compilerExplorer : {};
      const baseUrl = config.baseUrl ? config.baseUrl : "https://slides.compiler-explorer.com";

      element.onclick = (evt) => {
        if (evt.ctrlKey) {
          window.location.assign(baseUrl + "#" + ceFragment);
        }
      };
      element.textContent = displaySource;
    }
  },
});
