import Evidently from "aws-sdk/clients/evidently";
import React, { useState, useEffect } from "react";
import config from "./config";

const OldComponent = () => <p className="old-component">Old Component</p>;
const NewComponent = () => <p className="new-component">New Component</p>;

const client = new Evidently({
  endpoint: "https://evidently.ap-southeast-2.amazonaws.com",
  region: "ap-southeast-2",
  credentials: {
    accessKeyId: config.credentials.accessKeyId,
    secretAccessKey: config.credentials.secretAccessKey,
  },
});

const id = new Date().getTime().toString();

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [showFeature, setShowFeature] = useState(false);

  useEffect(() => {
    const evaluateFeatureRequest = {
      entityId: id,
      feature: "myfeature",
      project: "myproject",
      evaluationContext: {
        AccountID: "1234567890",
      },
    };

    client
      .evaluateFeature(evaluateFeatureRequest)
      .promise()
      .then((res) => {
        if (res.value?.boolValue !== undefined) {
          setShowFeature(res.value.boolValue);
        }

        setIsLoading(false);
      });
  }, []);

  return !isLoading ? (
    <div className="App">
      <header className="App-header">
        {showFeature ? <NewComponent /> : <OldComponent />}
      </header>
    </div>
  ) : (
    <div></div>
  );
}

export default App;
