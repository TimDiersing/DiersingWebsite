async function confirmDelete(id) {
    const userConfirmed = confirm("Are you sure you want to delete listing " + id + " ?");
    if (userConfirmed) {
        alert("Action confirmed!");
        try {
          await fetch("/admin/listing/" + id, {method: 'DELETE'});
        } catch (err) {
          console.error(err);
        }            
    } else {
        alert("Action canceled.");
    }
}