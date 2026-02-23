async function test() {
    console.log("Testing listSSPs...");
    try {
        const res1 = await fetch('http://localhost:3002/api/trpc/federal.listSSPs?input=' + encodeURIComponent('{"json":{"clientId":3,"fismaSystemId":1}}'));
        console.log("listSSPs:", await res1.text());
    } catch (e) { console.error('fetch error', e); }

    console.log("Testing getSspControls...");
    try {
        const res2 = await fetch('http://localhost:3002/api/trpc/federal.getSspControls?input=' + encodeURIComponent('{"json":{"clientId":3,"sspId":1}}'));
        console.log("getSspControls:", await res2.text());
    } catch (e) { console.error('fetch error', e); }

    console.log("Testing findings.stats...");
    try {
        const res3 = await fetch('http://localhost:3002/api/trpc/findings.stats?input=' + encodeURIComponent('{"json":{"clientId":3}}'));
        console.log("findings.stats:", await res3.text());
    } catch (e) { console.error('fetch error', e); }

    console.log("Testing getSarFindings...");
    try {
        const res4 = await fetch('http://localhost:3002/api/trpc/federal.getSarFindings?input=' + encodeURIComponent('{"json":{"clientId":3,"sarId":1}}'));
        console.log("getSarFindings:", await res4.text());
    } catch (e) { console.error('fetch error', e); }
}

test();
