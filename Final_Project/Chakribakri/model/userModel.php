<?php
class User {
    public $id;
    public $first_name;
    public $last_name;
    public $gender;
    public $email;
    public $phone_number;
    public $nid;
    public $varsity_id;
    public $file;
    public $password;
    public $role;
    public $token;

    public function __construct($first_name, $last_name, $gender, $email, $phone_number, $nid, $varsity_id, $file, $password, $role, $token = null) {
        $this->first_name = $first_name;
        $this->last_name = $last_name;
        $this->gender = $gender;
        $this->email = $email;
        $this->phone_number = $phone_number;
        $this->nid = $nid;
        $this->varsity_id = $varsity_id;
        $this->file = $file;
        $this->password = $password;
        $this->role = $role;
        $this->token = $token;
    }
}
?>