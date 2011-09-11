class DaysController < ApplicationController
  # GET /days
  # GET /days.xml
  before_filter :require_user, :except => [:index, :show]
  def add_tag
    day = Day.find_by_id(params[:tags_day_id])
    newtags = day.parse_tag_string(params[:tag_string])
    day.reload
    render :json => newtags 
  end
  def index
    @trip = Trip.find(params[:trip_id])
    @days = @trip.days

    respond_to do |format|
      format.html # index.html.erb
      format.xml  { render :xml => @days }
    end
  end

  # GET /days/1
  # GET /days/1.xml
  def show
    @trip = Trip.find(params[:trip_id])
    @day = Day.find(params[:id])
    @unit_system = current_user ? current_user.unit_system : "IMPERIAL" 

    respond_to do |format|
      format.html # show.html.erb
      format.xml  { render :xml => @day }
    end
  end

  # GET /days/new
  # GET /days/new.xml
  def new
    @trip = Trip.find(params[:trip_id])
    @prev_day = @trip.days[-1]
    @day = Day.new

    respond_to do |format|
      format.html # new.html.erb
      format.xml  { render :xml => @day }
    end
  end

  # GET /days/1/edit
  def edit
    @trip = Trip.find(params[:trip_id])
    @day = Day.new(params[:day])  
  end

  def create_new_day
    @day = Day.new(params[:day])
    @trip = Trip.find(params[:trip][:id])
    @day.trip = @trip

    if @day.save
      if @day.prev_id
        prev = @day.prev_day
        prev.next_id = @day.id
        prev.save
      end
      render :json => {'day' => @day}
    else
      render :json => {'status' => 'faliure'}
    end
  end

  # POST /days
  # POST /days.xml
  def create
    @trip = Trip.find(params[:trip_id])
    @day = Day.new(params[:day])  
    @day.trip = @trip

    respond_to do |format|
      if @day.save
         format.html { redirect_to(trip_day_path(@trip,@day), :notice => 'Day was successfully created.') }
    #    format.xml  { render :xml => @day, :status => :created, :location => @day }
      else
        format.html { render :action => "new" }
        format.xml  { render :xml => @day.errors, :status => :unprocessable_entity }
      end
    end
  end

  # PUT /days/1
  # PUT /days/1.xml
  def update
    @trip = Trip.find(params[:trip_id])
    @day = Day.find(params[:id])
    @day.assign(params[:day])
    
    respond_to do |format|
      if @day.save
        format.html { redirect_to(trip_day_path(@trip, @day), :notice => 'Day was successfully updated.') }
        format.xml  { head :ok }
      else
        format.html { redirect_to(edit_trip_day_path(@trip, @day)) }
        format.xml  { render :xml => @day.errors, :status => :unprocessable_entity }
      end
    end
  end

  # DELETE /days/1
  # DELETE /days/1.xml
  def destroy
    @trip = Trip.find(params[:trip_id])
    @day = Day.find(params[:id])
    prev_d = @day.prev_day
    next_d = @day.next_day
    prev_d.next_id = next_d.id
    next_d.prev_id = prev_d.id
    next_d.distance += @day.distance

    respond_to do |format|
      if user_can_modify(@trip) and @day.destroy
        prev_d.save
        next_d.save
        format.html { redirect_to(trip_days_path) }
        format.xml  { head :ok }
      else
        flash[:error] = "It appears you attempted to delete a suggestion that you did not create. Perhaps you need to log in?"
        format.html { redirect_to root_path }
        format.xml  { head :ok }
      end
    end
  end

  private 
  def user_can_modify(trip)
    trip.user == @current_user || (@current_user and @current_user.admin?)
  end

end
