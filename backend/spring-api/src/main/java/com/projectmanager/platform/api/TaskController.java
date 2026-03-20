package com.projectmanager.platform.api;

import com.projectmanager.platform.service.CurrentUserService;
import com.projectmanager.platform.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;
    private final CurrentUserService currentUserService;

    public TaskController(TaskService taskService, CurrentUserService currentUserService) {
        this.taskService = taskService;
        this.currentUserService = currentUserService;
    }

    @PostMapping
    public ViewModels.TaskView createTask(@Valid @RequestBody TaskRequests.CreateTaskRequest request) {
        return taskService.createTask(request, currentUserService.requireAuthenticatedUser());
    }

    @PatchMapping("/{taskId}/status")
    public ViewModels.TaskView updateStatus(
        @PathVariable UUID taskId,
        @Valid @RequestBody TaskRequests.UpdateTaskStatusRequest request
    ) {
        return taskService.updateStatus(taskId, request, currentUserService.requireAuthenticatedUser());
    }
}
