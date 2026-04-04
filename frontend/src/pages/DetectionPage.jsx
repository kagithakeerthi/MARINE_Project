import React, { useState } from "react";
import axios from "axios";

const DetectionPage = () => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  // Send to backend
  const handleUpload = async () => {
    if (!image) return alert("Please select an image");

    const formData = new FormData();
    formData.append("file", image);

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:8000/api/v1/detect/debris",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setResult(response.data);
    } catch (error) {
      console.error(error);
      alert("Error detecting debris");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Marine Debris Detection</h1>

      <input type="file" onChange={handleImageChange} />

      {preview && (
        <div>
          <h3>Preview:</h3>
          <img src={preview} alt="preview" width="300" />
        </div>
      )}

      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Processing..." : "Detect Debris"}
      </button>

      {result && (
        <div>
          <h3>Results:</h3>
          <p>Debris Count: {result.debriscount}</p>
          <p>Coverage: {result.coveragepercentage}%</p>

          <img
            src={`data:image/png;base64,${result.annotatedimage}`}
            alt="result"
            width="300"
          />
        </div>
      )}
    </div>
  );
};

export default DetectionPage;