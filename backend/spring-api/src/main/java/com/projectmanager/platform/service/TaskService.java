package com.projectmanager.platform.service;

import com.projectmanager.platform.api.TaskRequests;
import com.projectmanager.platform.api.ViewModels;
import com.projectmanager.platform.domain.TaskItem;
import com.projectmanager.platform.domain.TaskPriority;
import com.projectmanager.platform.domain.TaskStatus;
import com.projectmanager.platform.repository.TaskItemRepository;
import com.projectmanager.platform.security.AuthenticatedUser;
import com.projectmanager.platform.security.InputSanitizer;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class TaskService {

    private final TaskItemRepository taskItemRepository;
    private final ProjectAccessService projectAccessService;
    private final ViewMapper viewMapper;
    private final AuditService auditService;
    private final InputSanitizer inputSanitizer;

    public TaskService(
        TaskItemRepository taskItemRepository,
        ProjectAccessService projectAccessService,
        ViewMapper viewMapper,
        AuditService auditService,
        InputSanitizer inputSanitizer
    ) {
        this.taskItemRepository = taskItemRepository;
        this.projectAccessService = projectAccessService;
        this.viewMapper = viewMapper;
        this.auditService = auditService;
        this.inputSanitizer = inputSanitizer;
    }

    public ViewModels.TaskView createTask(TaskRequests.CreateTaskRequest request, AuthenticatedUser user) {
        var project = projectAccessService.requireProjectAccess(request.projectId(), user);

        TaskItem task = new TaskItem();
        task.setProject(project);
        task.setTitle(inputSanitizer.sanitizePlainText(request.title()));
        task.setDescription(inputSanitizer.sanitizeMultilineText(request.description()));
        task.setPriority(TaskPriority.valueOf(request.priority().toUpperCase()));
        task.setStatus(TaskStatus.valueOf(request.status()));
        task.setDueDate(request.dueDate());
        task.setAssignee(inputSanitizer.sanitizePlainText(request.assignee()));
        taskItemRepository.save(task);

        auditService.record(project, "Task", user.displayName(), "Created task " + task.getTitle() + ".");
        return viewMapper.toTaskView(task);
    }

    public ViewModels.TaskView updateStatus(UUID taskId, TaskRequests.UpdateTaskStatusRequest request, AuthenticatedUser user) {
        TaskItem task = taskItemRepository.findById(taskId)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Task not found."));

        projectAccessService.requireProjectAccess(task.getProject().getId(), user);
        task.setStatus(TaskStatus.valueOf(request.status()));
        taskItemRepository.save(task);

        auditService.record(task.getProject(), "Board", user.displayName(), "Moved task " + task.getTitle() + " to " + task.getStatus() + ".");
        return viewMapper.toTaskView(task);
    }
}
