/*
    Harness mínimo de testes no navegador.
    Cada teste imprime "TEST PASS <nome>" ou "TEST FAIL <nome>: <motivo>";
    done() imprime "TESTS DONE passed=N failed=N". tests/run.sh lê essas linhas.
*/

(function () {

    let passed = 0;
    let failed = 0;
    const queue = [];

    window.test = function (name, fn) {
        queue.push({ name, fn });
    };

    window.assertEqual = function (actual, expected, message) {
        const a = JSON.stringify(actual);
        const e = JSON.stringify(expected);
        if (a !== e) {
            throw new Error((message ? message + " — " : "") + "esperado " + e + ", recebido " + a);
        }
    };

    window.done = async function () {
        for (const { name, fn } of queue) {
            try {
                await fn();
                passed++;
                console.log("TEST PASS " + name);
            } catch (error) {
                failed++;
                console.log("TEST FAIL " + name + ": " + (error && error.message || error));
            }
        }
        console.log("TESTS DONE passed=" + passed + " failed=" + failed);
    };

})();
