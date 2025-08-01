export const corsHeaders = {
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Origin": process.env.AWS_SAM_LOCAL
    ? "http://localhost:3000"
    : "https://api.flowtester.ai",
  "Access-Control-Allow-Methods": "*",
};

export const getLambdaResponse = (output) => {
  return {
    statusCode: output.error ? (output.httpCode ? output.httpCode : 500) : 200,
    headers: corsHeaders,
    body: JSON.stringify(output),
  };
};

export const getHTMLResponse = (output) => {
  return {
    statusCode: output.error ? (output.httpCode ? output.httpCode : 500) : 200,
    headers: { ...corsHeaders, "Content-Type": "text/html" },
    body: output,
  };
};

export const getImageResponse = (output) => {
  const headers = corsHeaders;

  return {
    statusCode: output.error ? (output.httpCode ? output.httpCode : 500) : 200,
    headers: {
      ...headers,
      "Content-Length": output.length,
      "Content-Type": "image/jpeg",
    },
    body: output.toString("base64"),
    isBase64Encoded: true,
  };
};
