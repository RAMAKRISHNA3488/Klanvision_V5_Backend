async function run() {
  try {
    const response = await fetch('http://localhost:8080/api/admin/users');
    console.log("Status:", response.status);
    const json = await response.json();
    console.log("Response JSON:", json);
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
