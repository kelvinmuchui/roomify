import { useEffect, useState } from "react";
import { useParams } from "react-router";

const VisualizerId  = () => {
  const { id } = useParams();
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      setImage(sessionStorage.getItem(`roomify-image-${id}`));
    }
  }, [id]);

  return (
    <main>
      {image ? (
        <img src={image} alt="Uploaded floor plan" />
      ) : (
        <p>No uploaded floor plan found.</p>
      )}
    </main>
  );
}

export default VisualizerId 