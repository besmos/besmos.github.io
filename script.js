import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';

const DATA_URL = 'https://raw.githubusercontent.com/besmos/besmos.github.io/refs/heads/data/reddit-data.xml';

async function fetchRedditPosts() {
    const listElement = document.getElementById('reddit-posts');
    try {
        const response = await fetch(DATA_URL);
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        const entries = xmlDoc.getElementsByTagName('entry');

        listElement.innerHTML = '';

        for (let i = 0; i < Math.min(entries.length, 10); i++) {
            const entry = entries[i];
            const title = entry.getElementsByTagName('title')[0].textContent;
            const author = entry.getElementsByTagName('name')[0].textContent;
            const link = entry.getElementsByTagName('link')[0].getAttribute('href');

            // Try to find a thumbnail link in the content or media:thumbnail
            let thumbnailUrl = '';

            // Look for any <img> in the content (CDATA)
            const content = entry.getElementsByTagName('content')[0].textContent;
            const imgMatch = content.match(/<img src="([^"]+)"/);
            if (imgMatch) {
                thumbnailUrl = imgMatch[1].replace(/&amp;/g, '&');
            } else {
                // Try for the thumbnail tag
                const mediaThumb = entry.getElementsByTagName('thumbnail')[0] || entry.getElementsByTagNameNS('*', 'thumbnail')[0];
                if (mediaThumb) thumbnailUrl = mediaThumb.getAttribute('url');
            }

            const li = document.createElement('li');
            li.style.marginBottom = '20px';
            li.style.listStyleType = 'none';

            let imgHtml = thumbnailUrl ? `<br><img src="${thumbnailUrl}" style="max-width: 200px; border-radius: 8px; border: 1px solid #ccc; margin-top: 5px;">` : '';

            li.innerHTML = `<b>${title}</b> by ${author} - <a href="${link}" target="_blank">View</a>${imgHtml}`;
            listElement.appendChild(li);
        }
    } catch (error) {
        console.error('Error fetching Reddit data:', error);
        listElement.innerHTML = '<li>Error loading posts (probably reddit being weird)</li>';
    }
}

function initBernard() {
    const container = document.getElementById('bernard-container');
    if (!container) return;

    const width = 200;
    const height = 200;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(2, 2, 2);
    scene.add(dirLight);

    camera.position.z = 4;
    camera.position.y = 1;
    camera.lookAt(0, 0, 0);

    const loader = new STLLoader();
    loader.load('./bernard.stl', function (geometry) {
        const material = new THREE.MeshPhongMaterial({ color: 0x4caf50 });
        const mesh = new THREE.Mesh(geometry, material);

        // Center the geometry
        geometry.center();

        // Scale it down/up moderately (adjust if needed)
        // Let's compute a scale factor
        geometry.computeBoundingSphere();
        const sphere = geometry.boundingSphere;
        const scale = 1.5 / Math.max(sphere.radius, 1);
        mesh.scale.set(scale, scale, scale);

        scene.add(mesh);

        function animate() {
            requestAnimationFrame(animate);
            mesh.rotation.y += 0.02;
            mesh.rotation.x += 0.005;
            renderer.render(scene, camera);
        }
        animate();
    }, undefined, function (error) {
        console.error('Error loading STL:', error);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    fetchRedditPosts();
    initBernard();
});
