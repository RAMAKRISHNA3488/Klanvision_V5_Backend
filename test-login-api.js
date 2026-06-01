async function run() {
  try {
    const response = await fetch('http://localhost:8080/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        usernameOrEmail: 'ramak3488@gmail.com',
        password: 'Ramak3488@'
      })
    });
    console.log("Status:", response.status);
    const json = await response.json();
    console.log("Response JSON:", json);
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
