import axios from "axios";

const fetchData = async (username) => {
    try {
        const response = await axios.get(`http://localhost:5000/api/points/${username}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching data for ${username}:`, error.message);
        return null;
    }
};

export default fetchData;
