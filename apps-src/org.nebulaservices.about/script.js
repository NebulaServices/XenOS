document.addEventListener('DOMContentLoaded', () => {
    function main() {
        const build = window.xen.version.build.split("-")[0];

        document.getElementById("about").innerHTML = `
            <strong>XenOS ${window.xen.version.codename}</strong><br>
            v${window.xen.version.major}.${window.xen.version.minor}.${window.xen.version.patch} (Build: ${build})<br><br>
            XenOS is licensed under the <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank">GNU AGPLv3</a> license<br>
            The GitHub repository can be found <a href="https://github.com/nebulaservices/xenos" target="_blank">here</a>
        `;
    }

    setTimeout(() => { main() }, 500);
});
