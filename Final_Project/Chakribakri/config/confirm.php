<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../repo/userRepo.php';

if (isset($_GET['token']) && isset($_GET['email'])) {
    $token = $_GET['token'];
    $email = $_GET['email'];

    $repo = new UserRepo($conn);

    if ($repo->confirmUser($email, $token)) {
        echo "<script>alert('Your account has been confirmed! You can now login.'); window.location.href='../html/login.html';</script>";
    } else {
        echo "<script>alert('Invalid or expired confirmation link.'); window.location.href='../html/signUp.html';</script>";
    }
} else {
    echo "Invalid request.";
}
