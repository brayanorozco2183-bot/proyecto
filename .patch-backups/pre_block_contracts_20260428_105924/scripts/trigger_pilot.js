import axios from 'axios';

async function trigger() {
    try {
        const response = await axios.post('http://localhost:8081/api/command', {
            command: 'Cerrajeros Valencia',
            publish_mode: 'publish',
            site_type: 'static',
            is_cluster: false
        });
        console.log('Success:', response.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

trigger();
