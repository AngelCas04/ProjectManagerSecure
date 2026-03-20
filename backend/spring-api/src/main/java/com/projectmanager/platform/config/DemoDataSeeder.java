package com.projectmanager.platform.config;

import com.projectmanager.platform.domain.AppUser;
import com.projectmanager.platform.domain.AuditEvent;
import com.projectmanager.platform.domain.CalendarEntry;
import com.projectmanager.platform.domain.ChatMessage;
import com.projectmanager.platform.domain.EventType;
import com.projectmanager.platform.domain.MembershipStatus;
import com.projectmanager.platform.domain.Project;
import com.projectmanager.platform.domain.ProjectMember;
import com.projectmanager.platform.domain.ProjectRoleName;
import com.projectmanager.platform.domain.RoleName;
import com.projectmanager.platform.domain.TaskItem;
import com.projectmanager.platform.domain.TaskPriority;
import com.projectmanager.platform.domain.TaskStatus;
import com.projectmanager.platform.repository.AppUserRepository;
import com.projectmanager.platform.repository.AuditEventRepository;
import com.projectmanager.platform.repository.CalendarEntryRepository;
import com.projectmanager.platform.repository.ChatMessageRepository;
import com.projectmanager.platform.repository.ProjectMemberRepository;
import com.projectmanager.platform.repository.ProjectRepository;
import com.projectmanager.platform.repository.TaskItemRepository;
import com.projectmanager.platform.service.WorkGroupService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Component
public class DemoDataSeeder implements CommandLineRunner {

    private final AppUserRepository appUserRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final TaskItemRepository taskItemRepository;
    private final CalendarEntryRepository calendarEntryRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final AuditEventRepository auditEventRepository;
    private final PasswordEncoder passwordEncoder;
    private final WorkGroupService workGroupService;

    public DemoDataSeeder(
        AppUserRepository appUserRepository,
        ProjectRepository projectRepository,
        ProjectMemberRepository projectMemberRepository,
        TaskItemRepository taskItemRepository,
        CalendarEntryRepository calendarEntryRepository,
        ChatMessageRepository chatMessageRepository,
        AuditEventRepository auditEventRepository,
        PasswordEncoder passwordEncoder,
        WorkGroupService workGroupService
    ) {
        this.appUserRepository = appUserRepository;
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.taskItemRepository = taskItemRepository;
        this.calendarEntryRepository = calendarEntryRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.auditEventRepository = auditEventRepository;
        this.passwordEncoder = passwordEncoder;
        this.workGroupService = workGroupService;
    }

    @Override
    public void run(String... args) {
        if (appUserRepository.count() > 0) {
            return;
        }

        AppUser admin = createUser("Valeria Ruiz", "valeria.ruiz@acme.dev", "Platform Security", RoleName.ADMINISTRADOR);
        AppUser engineer = createUser("Sofia Campos", "sofia.campos@acme.dev", "Backend Delivery", RoleName.MIEMBRO_PROYECTO);
        AppUser desktop = createUser("Diego Lara", "diego.lara@acme.dev", "Desktop Delivery", RoleName.MIEMBRO_PROYECTO);
        AppUser analyst = createUser("Angel Castillo", "angel@edu.sv", "Product Delivery", RoleName.MIEMBRO_PROYECTO);

        workGroupService.ensurePrimaryWorkGroupMembership(admin, admin.getTeam(), true);
        workGroupService.ensurePrimaryWorkGroupMembership(engineer, engineer.getTeam(), false);
        workGroupService.ensurePrimaryWorkGroupMembership(desktop, desktop.getTeam(), false);
        workGroupService.ensurePrimaryWorkGroupMembership(analyst, analyst.getTeam(), false);

        Project atlas = createProject(admin, "PX-01", "Atlas Cloud Migration", "Infrastructure",
            "Migrate restricted workloads into private AWS segments with audited release gates.",
            "Valeria Ruiz", "Medium", "Restricted", "RBAC + dual approval", LocalDate.now().plusDays(7));
        Project sentinel = createProject(admin, "PX-02", "Sentinel API Gateway", "Backend",
            "Harden the edge API with policy enforcement, observability and secure service routing.",
            "Sofia Campos", "High", "Confidential", "Private squad", LocalDate.now().plusDays(14));
        Project nova = createProject(admin, "PX-03", "Nova Desktop Client", "Desktop",
            "Ship a signed desktop client with secure auto update and zero embedded secrets.",
            "Diego Lara", "Low", "Internal", "Team restricted", LocalDate.now().plusDays(21));

        addMember(atlas, admin, ProjectRoleName.OWNER);
        addMember(sentinel, admin, ProjectRoleName.OWNER);
        addMember(nova, admin, ProjectRoleName.OWNER);
        addMember(sentinel, engineer, ProjectRoleName.MAINTAINER);
        addMember(nova, desktop, ProjectRoleName.MAINTAINER);

        createTask(atlas, "Define emergency access flow", "Document temporary elevated access with approval expiration windows.", TaskPriority.CRITICAL, TaskStatus.TODO, LocalDate.now().plusDays(2), "Mario Vega");
        createTask(atlas, "Map VPC trust boundaries", "Review private subnets, service tiers and backend to RDS connectivity rules.", TaskPriority.HIGH, TaskStatus.IN_PROGRESS, LocalDate.now().plusDays(1), "Valeria Ruiz");
        createTask(sentinel, "Expose audit events per project", "Surface permission changes and critical actions for operator review.", TaskPriority.HIGH, TaskStatus.IN_PROGRESS, LocalDate.now().plusDays(3), "Sofia Campos");
        createTask(nova, "Update release signing pipeline", "Desktop packages must verify publisher signature and checksum before install.", TaskPriority.CRITICAL, TaskStatus.IN_PROGRESS, LocalDate.now().plusDays(5), "Diego Lara");

        createEvent(atlas, "Security standup", EventType.MEETING, LocalDate.now().plusDays(1), LocalTime.of(9, 0), "Valeria Ruiz");
        createEvent(sentinel, "Sprint 24 delivery", EventType.DEADLINE, LocalDate.now().plusDays(2), LocalTime.of(11, 30), "Sofia Campos");
        createEvent(nova, "Desktop update review", EventType.REVIEW, LocalDate.now().plusDays(3), LocalTime.of(15, 0), "Diego Lara");

        createMessage(sentinel, engineer, "Scopes for restricted projects are live and ready for frontend mapping.");
        createMessage(sentinel, admin, "Great. Keep attachments disabled until content scanning is enforced server side.");
        createMessage(nova, desktop, "Release signatures are aligned with the update manifest now.");

        createAudit(sentinel, "Security", "Valeria Ruiz", "Consolidated secure session assumptions for the workspace shell.");
        createAudit(sentinel, "Audit", "Sofia Campos", "Enabled task state change events for project level timelines.");
        createAudit(atlas, "Delivery", "Mario Vega", "Updated Kanban model with priority, due date and assignment metadata.");
    }

    private AppUser createUser(String name, String email, String team, RoleName role) {
        AppUser user = new AppUser();
        user.setName(name);
        user.setEmail(email);
        user.setTeam(team);
        user.setRole(role);
        user.setPasswordHash(passwordEncoder.encode("SecurePass123!"));
        user.setEnabled(true);
        return appUserRepository.save(user);
    }

    private Project createProject(AppUser owner, String code, String name, String domain, String summary, String lead, String risk, String classification, String permissions, LocalDate dueDate) {
        Project project = new Project();
        project.setCode(code);
        project.setName(name);
        project.setDomain(domain);
        project.setSummary(summary);
        project.setLead(lead);
        project.setRisk(risk);
        project.setClassification(classification);
        project.setPermissions(permissions);
        project.setDueDate(dueDate);
        project.setOwner(owner);
        return projectRepository.save(project);
    }

    private void addMember(Project project, AppUser user, ProjectRoleName role) {
        ProjectMember member = new ProjectMember();
        member.setProject(project);
        member.setUser(user);
        member.setRole(role);
        member.setStatus(MembershipStatus.ACTIVE);
        projectMemberRepository.save(member);
    }

    private void createTask(Project project, String title, String description, TaskPriority priority, TaskStatus status, LocalDate dueDate, String assignee) {
        TaskItem task = new TaskItem();
        task.setProject(project);
        task.setTitle(title);
        task.setDescription(description);
        task.setPriority(priority);
        task.setStatus(status);
        task.setDueDate(dueDate);
        task.setAssignee(assignee);
        taskItemRepository.save(task);
    }

    private void createEvent(Project project, String title, EventType type, LocalDate date, LocalTime time, String owner) {
        CalendarEntry event = new CalendarEntry();
        event.setProject(project);
        event.setTitle(title);
        event.setType(type);
        event.setDate(date);
        event.setTime(time);
        event.setOwner(owner);
        calendarEntryRepository.save(event);
    }

    private void createMessage(Project project, AppUser author, String text) {
        ChatMessage message = new ChatMessage();
        message.setProject(project);
        message.setAuthor(author);
        message.setChatTeam(author.getTeam());
        message.setText(text);
        chatMessageRepository.save(message);
    }

    private void createAudit(Project project, String scope, String actor, String description) {
        AuditEvent event = new AuditEvent();
        event.setProject(project);
        event.setScope(scope);
        event.setActor(actor);
        event.setDescription(description);
        auditEventRepository.save(event);
    }
}
