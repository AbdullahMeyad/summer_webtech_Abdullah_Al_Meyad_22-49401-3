<?php

class Job {
    public $id;
    public $title;
    public $company;
    public $type;
    public $salary;
    public $location;
    public $description;
    public $requirements;
    public $posted_by;
    public $posted_date;
    public $deadline;

    public function __construct(
        $id, $title, $company, $type, $salary, $location, 
        $description, $requirements, $posted_by, $posted_date, $deadline
    ) {
        $this->id = $id;
        $this->title = $title;
        $this->company = $company;
        $this->type = $type;
        $this->salary = $salary;
        $this->location = $location;
        $this->description = $description;
        $this->requirements = $requirements;
        $this->posted_by = $posted_by;
        $this->posted_date = $posted_date;
        $this->deadline = $deadline;
    }
}
