function fetchMethod(url, callback, method, data, token) {
  // Default values
  method = method || "GET";
  data = (typeof data === "undefined") ? null : data;
  token = token || null;

  // Build full API URL
  const finalUrl = (url && url.startsWith("http"))
    ? url
    : (API_BASE_URL + url);

  // Use token from localStorage if not provided
  const authToken = token || localStorage.getItem("token");

  const headers = {};

  if (data !== null && method.toUpperCase() !== "GET") {
    headers["Content-Type"] = "application/json";
  }

  if (authToken) {
    headers["Authorization"] = "Bearer " + authToken;
  }

  const options = {
    method: method.toUpperCase(),
    headers: headers
  };

  if (options.method !== "GET" && data !== null) {
    options.body = JSON.stringify(data);
  }

  fetch(finalUrl, options)
    .then(function (response) {
      // Handle 204 No Content
      if (response.status === 204) {
        callback(204, null);
        return null;
      }

      const contentType = response.headers.get("content-type") || "";
      const isJson = contentType.indexOf("application/json") !== -1;

      if (isJson) {
        return response.json()
          .catch(function () { return {}; })
          .then(function (payload) {
            // Clear token silently if unauthorized
            if (response.status === 401) {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
            }

            callback(response.status, payload);
            return null;
          });
      }

      // Non-JSON response
      return response.text().then(function (text) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }

        callback(response.status, { message: text });
        return null;
      });
    })
    .catch(function (error) {
      console.error("fetchMethod network error:", error);
      callback(500, { message: "Network error" });
    });
}
